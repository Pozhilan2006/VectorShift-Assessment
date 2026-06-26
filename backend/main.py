from collections import deque
import re
from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, Field

app = FastAPI()

# Allow React frontend (localhost:3000) to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Node(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    type: Optional[str] = None
    data: Optional[dict[str, Any]] = None
    position: Optional[dict[str, Any]] = None


class Edge(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class PipelineRequest(BaseModel):
    nodes: list[Node] = Field(default_factory=list)
    edges: list[Edge] = Field(default_factory=list)


class Summary(BaseModel):
    nodes: int
    edges: int
    variables: int
    connections: int
    inputs: int
    outputs: int
    isolated_nodes: int
    warnings: int
    errors: int
    is_dag: bool
    ready: bool


class ValidationCheck(BaseModel):
    type: str  # "success" | "warning" | "error"
    severity: str  # "success" | "warning" | "error" (for double compatibility)
    message: str


class PipelineParseResponse(BaseModel):
    num_nodes: int
    num_edges: int
    is_dag: bool
    variables: list[str] = Field(default_factory=list)
    summary: Summary
    checks: list[ValidationCheck]


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Invalid request body",
            "errors": exc.errors(),
        },
    )


@app.get("/")
def read_root():
    return {"Ping": "Pong"}


@app.post(
    "/pipelines/parse",
    response_model=PipelineParseResponse
)
def parse_pipeline(
    pipeline: PipelineRequest
):
    nodes = pipeline.nodes
    edges = pipeline.edges
    checks = []

    node_ids = {node.id for node in nodes}

    # Detect duplicate node IDs
    seen_nodes = set()
    duplicate_nodes = set()
    for n in nodes:
        if n.id in seen_nodes:
            duplicate_nodes.add(n.id)
        seen_nodes.add(n.id)

    for dup in duplicate_nodes:
        checks.append(ValidationCheck(
            type="error",
            severity="error",
            message=f"Duplicate node ID detected: '{dup}'."
        ))

    # Detect duplicate edge IDs
    seen_edges = set()
    duplicate_edges = set()
    for e in edges:
        if e.id and e.id in seen_edges:
            duplicate_edges.add(e.id)
        if e.id:
            seen_edges.add(e.id)

    for dup in duplicate_edges:
        checks.append(ValidationCheck(
            type="error",
            severity="error",
            message=f"Duplicate edge ID detected: '{dup}'."
        ))

    # Validate edge references and format
    valid_edges = []
    for edge in edges:
        if not edge.source or not edge.target:
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message="Edge is missing source or target definition."
            ))
            continue

        source_ok = edge.source in node_ids
        target_ok = edge.target in node_ids

        if not source_ok:
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message=f"Edge references missing source node: '{edge.source}'."
            ))
        if not target_ok:
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message=f"Edge references missing target node: '{edge.target}'."
            ))

        if source_ok and target_ok:
            valid_edges.append(edge)

    # 1. Graph validation - Kahn's Algorithm for DAG & Cycles
    is_dag = True
    if node_ids:
        adjacency = {node_id: [] for node_id in node_ids}
        in_degree = {node_id: 0 for node_id in node_ids}

        for edge in valid_edges:
            adjacency[edge.source].append(edge.target)
            in_degree[edge.target] += 1

        queue = deque([nid for nid in node_ids if in_degree[nid] == 0])
        visited = 0
        while queue:
            curr = queue.popleft()
            visited += 1
            for neighbor in adjacency[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        is_dag = (visited == len(node_ids))

    if is_dag:
        checks.append(ValidationCheck(
            type="success",
            severity="success",
            message="Pipeline is a DAG."
        ))
    else:
        checks.append(ValidationCheck(
            type="error",
            severity="error",
            message="Pipeline contains cycles (not a DAG)."
        ))

    # Degrees and adjacency for other validations
    in_edges = {nid: [] for nid in node_ids}
    out_edges = {nid: [] for nid in node_ids}
    undirected_adj = {nid: set() for nid in node_ids}

    for edge in valid_edges:
        in_edges[edge.target].append(edge)
        out_edges[edge.source].append(edge)
        undirected_adj[edge.source].add(edge.target)
        undirected_adj[edge.target].add(edge.source)

    # Isolated nodes
    isolated_nodes_count = 0
    for nid in node_ids:
        if len(in_edges[nid]) == 0 and len(out_edges[nid]) == 0:
            isolated_nodes_count += 1
            node_obj = next((n for n in nodes if n.id == nid), None)
            node_type_label = node_obj.type if node_obj else "Node"
            node_name = nid
            if node_obj and node_obj.data:
                node_name = node_obj.data.get('inputName') or node_obj.data.get('outputName') or node_obj.data.get('tableName') or node_obj.data.get('conditionName') or nid
            checks.append(ValidationCheck(
                type="warning",
                severity="warning",
                message=f"{node_type_label.capitalize()} node '{node_name}' is isolated."
            ))

    # Connected Components (undirected) to detect disconnected subgraphs
    visited_undirected = set()
    components = 0
    for nid in node_ids:
        if nid not in visited_undirected:
            components += 1
            comp_queue = deque([nid])
            visited_undirected.add(nid)
            while comp_queue:
                curr = comp_queue.popleft()
                for neighbor in undirected_adj[curr]:
                    if neighbor not in visited_undirected:
                        visited_undirected.add(neighbor)
                        comp_queue.append(neighbor)

    if len(node_ids) > 0 and components > 1:
        checks.append(ValidationCheck(
            type="warning",
            severity="warning",
            message="Pipeline contains disconnected components/islands."
        ))

    # Reachability from execution roots (directed)
    execution_roots = [nid for nid in node_ids if len(in_edges[nid]) == 0]
    visited_directed = set()
    roots_queue = deque(execution_roots)
    for r in execution_roots:
        visited_directed.add(r)
    while roots_queue:
        curr = roots_queue.popleft()
        for edge in out_edges[curr]:
            if edge.target not in visited_directed:
                visited_directed.add(edge.target)
                roots_queue.append(edge.target)

    for nid in node_ids:
        if nid not in visited_directed:
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message=f"Node '{nid}' is unreachable from execution roots."
            ))

    # Workflow validation
    inputs_count = sum(1 for n in nodes if n.type == 'customInput')
    outputs_count = sum(1 for n in nodes if n.type == 'customOutput')

    if inputs_count == 0:
        checks.append(ValidationCheck(
            type="error",
            severity="error",
            message="Pipeline requires at least one Input node."
        ))
    else:
        checks.append(ValidationCheck(
            type="success",
            severity="success",
            message=f"Input node detected ({inputs_count} present)."
        ))

    if outputs_count == 0:
        checks.append(ValidationCheck(
            type="error",
            severity="error",
            message="Pipeline requires at least one Output node."
        ))
    elif outputs_count > 1:
        checks.append(ValidationCheck(
            type="warning",
            severity="warning",
            message=f"Pipeline contains multiple ({outputs_count}) Output nodes."
        ))
    else:
        checks.append(ValidationCheck(
            type="success",
            severity="success",
            message="Output node detected."
        ))

    # Ensure every Output has an incoming connection
    for n in nodes:
        if n.type == 'customOutput':
            if len(in_edges[n.id]) == 0:
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Output node '{n.id}' has no incoming connections."
                ))

    # Ensure every execution path reaches an output
    can_reach_output = set()
    output_nodes = [n.id for n in nodes if n.type == 'customOutput']
    reverse_adj = {nid: [] for nid in node_ids}
    for edge in valid_edges:
        reverse_adj[edge.target].append(edge.source)

    rev_queue = deque(output_nodes)
    for o in output_nodes:
        can_reach_output.add(o)
    while rev_queue:
        curr = rev_queue.popleft()
        for parent in reverse_adj[curr]:
            if parent not in can_reach_output:
                can_reach_output.add(parent)
                rev_queue.append(parent)

    for n in nodes:
        if n.id not in can_reach_output and n.type != 'customOutput':
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message=f"Execution path from '{n.id}' does not reach any Output node."
            ))

    # Dead-end nodes (nodes other than Output with 0 outgoing connections)
    for n in nodes:
        if n.type != 'customOutput' and len(out_edges[n.id]) == 0:
            if len(in_edges[n.id]) > 0:
                checks.append(ValidationCheck(
                    type="warning",
                    severity="warning",
                    message=f"Node '{n.id}' is a dead-end (no outgoing connections)."
                ))

    # Orphan nodes (nodes other than Input with 0 incoming connections)
    for n in nodes:
        if n.type != 'customInput' and len(in_edges[n.id]) == 0:
            if len(out_edges[n.id]) > 0:
                checks.append(ValidationCheck(
                    type="warning",
                    severity="warning",
                    message=f"Node '{n.id}' is an orphan (no incoming connections)."
                ))

    # Unreachable execution paths (nodes that cannot be reached from any Input node)
    input_nodes = [n.id for n in nodes if n.type == 'customInput']
    visited_from_input = set(input_nodes)
    input_queue = deque(input_nodes)
    while input_queue:
        curr = input_queue.popleft()
        for edge in out_edges[curr]:
            if edge.target not in visited_from_input:
                visited_from_input.add(edge.target)
                input_queue.append(edge.target)

    for n in nodes:
        if n.id not in visited_from_input and n.type != 'customInput':
            checks.append(ValidationCheck(
                type="warning",
                severity="warning",
                message=f"Node '{n.id}' is unreachable from any Input node."
            ))

    # Node-specific validation
    required_fields_missing = False
    for n in nodes:
        data = n.data or {}
        if n.type == 'customInput':
            if not data.get('inputName'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Input node '{n.id}' is missing Name."
                ))
            if not data.get('inputType'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Input node '{n.id}' is missing Type."
                ))
        elif n.type == 'customOutput':
            if not data.get('outputName'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Output node '{n.id}' is missing Name."
                ))
            if not data.get('outputType'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Output node '{n.id}' is missing Type."
                ))
        elif n.type == 'prompt':
            template = data.get('template')
            if not template:
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Prompt node '{n.id}' template cannot be empty."
                ))
            temp = data.get('temperature')
            if temp is not None:
                try:
                    val = float(temp)
                    if not (0 <= val <= 2):
                        required_fields_missing = True
                        checks.append(ValidationCheck(
                            type="error",
                            severity="error",
                            message=f"Prompt node '{n.id}' temperature must be between 0 and 2."
                        ))
                except ValueError:
                    required_fields_missing = True
                    checks.append(ValidationCheck(
                        type="error",
                        severity="error",
                        message=f"Prompt node '{n.id}' temperature must be a valid number."
                    ))
        elif n.type == 'api':
            url = data.get('url')
            method = data.get('method')
            if not url:
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"API node '{n.id}' URL is required."
                ))
            elif not (url.startswith('http://') or url.startswith('https://')):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"API node '{n.id}' URL must be valid."
                ))
            if not method or method not in ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']:
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"API node '{n.id}' method must be GET, POST, PUT, PATCH, or DELETE."
                ))
        elif n.type == 'database':
            if not data.get('tableName'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Database node '{n.id}' is missing Table Name."
                ))
            if not data.get('operation'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Database node '{n.id}' is missing Operation."
                ))
        elif n.type == 'condition':
            if not data.get('conditionName'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Condition node '{n.id}' is missing Condition Name."
                ))
            if not data.get('expression'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Condition node '{n.id}' is missing Expression."
                ))
        elif n.type == 'transform':
            if not data.get('transformType'):
                required_fields_missing = True
                checks.append(ValidationCheck(
                    type="error",
                    severity="error",
                    message=f"Transform node '{n.id}' is missing Transformation Type."
                ))

    # Variable Validation
    all_variables = []
    for n in nodes:
        if n.type == 'prompt':
            template = (n.data or {}).get('template', '')
            vars_found = re.findall(r'\{\{\s*(\w+)\s*\}\}', template)
            for v in vars_found:
                all_variables.append((n.id, v))

    unique_variables = list(set([v for _, v in all_variables]))

    # Validate that every referenced variable has an incoming edge
    for node_id, var_name in all_variables:
        expected_handle = f"{node_id}-{var_name}"
        connected = False
        for edge in valid_edges:
            if edge.target == node_id and edge.targetHandle == expected_handle:
                connected = True
                break

        if not connected:
            checks.append(ValidationCheck(
                type="error",
                severity="error",
                message=f"Unknown variable: {{{{ {var_name} }}}} in Prompt node '{node_id}' (no incoming connection)."
            ))

    # Warn about unused variables / inputs
    for n in nodes:
        if n.type == 'customInput':
            name = (n.data or {}).get('inputName') or n.id
            has_outgoing = any(edge.source == n.id for edge in valid_edges)
            if not has_outgoing:
                checks.append(ValidationCheck(
                    type="warning",
                    severity="warning",
                    message=f"Input '{name}' is not connected to any destination."
                ))

    # Count warnings and errors
    warning_count = sum(1 for c in checks if c.type == 'warning')
    error_count = sum(1 for c in checks if c.type == 'error')

    # Determine Ready flag
    ready = (
        error_count == 0 and
        is_dag and
        inputs_count >= 1 and
        outputs_count >= 1 and
        not required_fields_missing
    )

    summary = Summary(
        nodes=len(nodes),
        edges=len(edges),
        variables=len(unique_variables),
        connections=len(edges),
        inputs=inputs_count,
        outputs=outputs_count,
        isolated_nodes=isolated_nodes_count,
        warnings=warning_count,
        errors=error_count,
        is_dag=is_dag,
        ready=ready
    )

    return PipelineParseResponse(
        num_nodes=len(nodes),
        num_edges=len(edges),
        is_dag=is_dag,
        variables=unique_variables,
        summary=summary,
        checks=checks
    )