# VectorShift Frontend Technical Assessment

This project is a visual workflow pipeline builder that allows users to create node-based execution graphs using a drag-and-drop interface. It consists of a React frontend and a FastAPI backend designed to handle node placement, canvas connections, and real-time graph validation.

The primary objective is to separate user interface composition from semantic graph logic. Users assemble nodes and edges locally on the canvas, while topological, validation, and connectivity audits are processed on the backend. This architecture ensures that graph execution logic is validated against strict constraints before being executed.

---

## Project Highlights

* **Interactive Canvas**: Drag-and-drop node creation, multi-handle connections, and panning/zooming.
* **Nine Node Subtypes**: Configurable nodes including Input, Output, LLMs, Prompts, Databases, and APIs.
* **Dynamic Variable Tracking**: Automatic parsing of custom `{{variable}}` patterns within templates to generate corresponding input handles dynamically.
* **Real-time Graph Parsing**: Detects cyclic paths, isolated node sets, and execution root reachability.
* **Compact Spotlight Overlay**: An optimization to assist cursor tracking on white canvas layouts using hardware-accelerated animations.

---

## Architecture

The system splits responsibilities between the client application and a central parsing engine:

```
[React Canvas] ----(Nodes & Edges JSON Payload)----> [FastAPI Parser]
       ^                                                    │
       │                                                    ▼
[Render Updates] <----(Validation & Metrics Report)---- [Engine Checks]
```

* **Frontend (Client)**: Captures user node dragging, connects handles, processes text input, and renders real-time visual alerts. State is centralized in a Zustand store.
* **Backend (Validation Engine)**: A stateless validation API. It reconstructs the pipeline graph, determines if the flow forms a Directed Acyclic Graph (DAG), validates required fields, and reviews execution paths.

---

## Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React | Component structure and UI composition |
| **Canvas Engine** | ReactFlow | Canvas layout, node rendering, and edge drawing |
| **State Management** | Zustand | Global store for nodes, edges, and connection logic |
| **Backend Framework** | FastAPI | High-performance async API parser |
| **Data Validation** | Pydantic | Schema enforcement for node/edge payloads |
| **Styling** | Vanilla CSS | Custom responsive elements and UI presentation |

---

## Project Structure

```text
Assessment/
├── backend/                  # Python FastAPI application
│   ├── main.py               # Main API routes and graph validation logic
│   └── requirements.txt      # Python dependencies
│
├── frontend/                 # React frontend application
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── components/       # Global custom UI components
│   │   ├── nodes/            # ReactFlow custom node definitions
│   │   ├── App.js            # Main page assembly
│   │   ├── store.js          # Zustand store for node/edge mutations
│   │   ├── submit.js         # Pipeline submission button and validation modal
│   │   └── index.css         # Typography, layout overrides, and animation keyframes
│   └── package.json          # Node dependencies and build scripts
│
└── README.md                 # Project documentation
```

---

## Getting Started

### Prerequisites
* **Node.js** (v16.0 or higher)
* **Python** (3.8 or higher)

### Setup
Clone the repository to your local machine:
```bash
git clone https://github.com/pozhilan-dev/VectorShift-Assessment.git
cd VectorShift-Assessment
```

---

## Running the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the Uvicorn dev server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will run on `http://localhost:8000`.

---

## Running the Frontend

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
   The application will run on `http://localhost:3000`.

---

## Validation Engine

All graph validation resides on the backend API (`POST /pipelines/parse`). The engine receives the nodes and edges, builds an adjacency list, and runs the following checks:

1. **Topology Check**: Runs Kahn's algorithm to confirm if the pipeline is a Directed Acyclic Graph (DAG) or contains cycles.
2. **Connectivity Check**: Identifies isolated nodes, unconnected subgraphs, or dead-ends.
3. **Execution Path Verification**: Confirms that a valid path connects at least one Input node to at least one Output node.
4. **Required Configurations**: Validates node fields (e.g. valid URLs on API nodes, non-empty table configurations on Database nodes).
5. **Variable Verification**: Ensures that any parsed variable parameter (e.g., `{{variable_name}}`) receives an incoming edge from a source node.

---

## Supported Node Types

| Node | Purpose |
| :--- | :--- |
| **Input** | Defines entry points for data into the pipeline. Supports Text and File types. |
| **Output** | Defines termination points for pipeline results. Supports Text and Image types. |
| **Text** | Plain text container. Grows vertically as content is entered. |
| **LLM** | Configures execution through a language model (system prompts, temperature limits). |
| **Prompt** | Text template with dynamic handle creation based on `{{variable}}` placeholders. |
| **API** | Performs HTTP calls (GET, POST, PUT, DELETE) to external endpoints. |
| **Database** | Interfaces with data tables using operations (Select, Insert, Update, Delete). |
| **Transform** | Mutates string values (Uppercase, Lowercase, Trim, JSON Parse). |
| **Condition** | Directs execution paths based on custom Boolean checks (True/False outputs). |

---

## Example Workflow

A typical configuration involves:
1. An **Input Node** connected to a **Prompt Node** input port.
2. The user configures a template in the Prompt node: `Hello {{name}}, welcome to the platform.` (Generating a `name` handle).
3. Connect the Input node's output to the Prompt node's `name` handle.
4. Connect the Prompt node's output port to an **LLM Node** input port.
5. Connect the LLM node's output port to an **Output Node** to view execution results.

---

## Design Decisions

* **ReactFlow**: Chosen for its robust layout mechanics, performant viewport updates, and ease of creating customized nodes with specific handle properties.
* **Zustand**: Selected for state management because of its low boilerplate, compatibility with ReactFlow's update loops, and ability to prevent unnecessary re-renders of independent node components.
* **FastAPI**: Chosen for its automatic OpenAPI documentation generation, speed, and standard Pydantic models for request body deserialization.
* **Backend Validation**: Keeps graph validation logic separated from presentation concerns. This allows validation rules to be written in Python and reused across multiple client implementations without duplicating logic.

---
