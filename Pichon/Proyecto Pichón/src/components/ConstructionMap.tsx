import React, { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  MarkerType,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { Category } from '../types';
import { CustomNode } from './CustomNode';
import { useBudgetStore } from '../store/useBudgetStore';

interface ConstructionMapProps {
  categories: Category[];
  onCategorySelect: (category: Category) => void;
}

const nodeTypes = { custom: CustomNode };

const getLayout = (nodes: Node[], edges: Edge[]) => {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 80, nodesep: 30 });

  const W = 240;
  nodes.forEach(n => {
    const taskCount = n.data.activeTasks ? (n.data.activeTasks as any[]).length : 0;
    const H = taskCount > 0 ? 80 + taskCount * 64 : 80;
    g.setNode(n.id, { width: W, height: H });
  });
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);

  return {
    nodes: nodes.map(n => {
      const pos = g.node(n.id);
      const taskCount = n.data.activeTasks ? (n.data.activeTasks as any[]).length : 0;
      const H = taskCount > 0 ? 80 + taskCount * 64 : 80;
      return {
        ...n,
        targetPosition: 'left',
        sourcePosition: 'right',
        position: { x: pos.x - W / 2, y: pos.y - H / 2 },
      } as Node;
    }),
    edges,
  };
};

export const ConstructionMap: React.FC<ConstructionMapProps> = ({ categories, onCategorySelect }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const cart = useBudgetStore(s => s.cart);

  useEffect(() => {
    const cats = categories.filter(c => c.phase === 'A' || c.phase === 'B' || c.phase === 'C');

    const newNodes: Node[] = cats.map(cat => ({
      id: cat.id,
      type: 'custom',
      position: { x: 0, y: 0 },
      data: {
        label: cat.name,
        phase: cat.phase,
        iconId: cat.id,
        activeTasks: cart.filter(i => i.categoryId === cat.id),
      },
    }));

    const newEdges: Edge[] = [];
    cats.forEach(cat => {
      cat.predecessors?.forEach(predId => {
        if (cats.some(c => c.id === predId)) {
          newEdges.push({
            id: `e-${predId}-${cat.id}`,
            source: predId,
            target: cat.id,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#475569', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#475569' },
          });
        }
      });
    });

    const { nodes: ln, edges: le } = getLayout(newNodes, newEdges);
    setNodes(ln);
    setEdges(le);
  }, [categories, cart, setNodes, setEdges]);

  const onNodeClick = useCallback((_e: React.MouseEvent, node: Node) => {
    const cat = categories.find(c => c.id === node.id);
    if (cat) onCategorySelect(cat);
  }, [categories, onCategorySelect]);

  return (
    <div className="w-full h-full" style={{ background: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15}
        maxZoom={1.5}
        style={{ background: '#0f172a' }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1.5} />
        <Controls
          style={{ background: '#1e293b', border: '1px solid #334155' }}
          className="rounded-xl overflow-hidden shadow-xl"
        />
      </ReactFlow>
    </div>
  );
};
