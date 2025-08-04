'use client'

import { useCallback, useMemo, useEffect, useState } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Position,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  ConnectionMode
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'

interface OrgChartData {
  markets: any[]
  regions: any[]
  districts: any[]
  districtCounts: Record<number, number>
}

interface OrganizationChartProps {
  data: OrgChartData
  selectedMarket: number | null
  selectedRegion: number | null
  selectedDistrict: number | null
  onNodeClick: (type: string, id: number) => void
}

// Layout constants
const nodeWidth = 220
const nodeHeight = 80
const levelGap = 100

// Custom node component with expand/collapse
function OrgNode({ data, isConnectable }: { data: any; isConnectable: boolean }) {
  const getNodeStyle = () => {
    switch (data.level) {
      case 'market':
        return 'bg-alliance-blue text-white border-alliance-blue'
      case 'region':
        return 'bg-alliance-navy text-white border-alliance-navy'
      case 'district':
        return 'bg-alliance-green text-white border-alliance-green'
      default:
        return 'bg-gray-200 border-gray-400'
    }
  }

  const getIcon = () => {
    switch (data.level) {
      case 'market':
        return 'fa-globe'
      case 'region':
        return 'fa-map'
      case 'district':
        return 'fa-city'
      default:
        return 'fa-building'
    }
  }

  return (
    <>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <div 
        className={`px-4 py-3 rounded-lg shadow-lg border-2 cursor-pointer transition-all hover:shadow-xl ${getNodeStyle()} ${
          data.isSelected ? 'ring-4 ring-yellow-400 ring-offset-2' : ''
        }`}
        style={{ width: nodeWidth }}
        onClick={() => data.onClick(data.level, data.entityId)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <i className={`fas ${getIcon()} text-lg`} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{data.label}</div>
              {data.manager && (
                <div className="text-xs opacity-90 truncate">
                  {data.manager}
                </div>
              )}
            </div>
          </div>
          {data.hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                data.onToggle(data.nodeId)
              }}
              className="ml-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xs"
            >
              <i className={`fas fa-${data.isExpanded ? 'minus' : 'plus'}`} />
            </button>
          )}
        </div>
        <div className="text-xs opacity-75 mt-1">
          {data.childCount} {data.childType}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </>
  )
}

const nodeTypes: NodeTypes = {
  orgNode: OrgNode,
}

// Dagre layout for hierarchical positioning
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 50,
    ranksep: levelGap,
    edgesep: 10
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }
  })

  return { nodes, edges }
}

function OrganizationChartInner({
  data,
  selectedMarket,
  selectedRegion,
  selectedDistrict,
  onNodeClick
}: OrganizationChartProps) {
  const reactFlowInstance = useReactFlow()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // Initialize with all markets expanded
  useEffect(() => {
    const initialExpanded = new Set<string>()
    data.markets.forEach(market => {
      initialExpanded.add(`market-${market.market_id}`)
    })
    setExpandedNodes(initialExpanded)
  }, [data.markets])

  // Convert data to nodes and edges with proper hierarchy
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const nodes: Node[] = []
    const edges: Edge[] = []

    // Add market nodes (always visible)
    data.markets.forEach((market) => {
      const marketNodeId = `market-${market.market_id}`
      const regionCount = data.regions.filter(r => r.market_id === market.market_id).length
      const isExpanded = expandedNodes.has(marketNodeId)
      
      nodes.push({
        id: marketNodeId,
        type: 'orgNode',
        position: { x: 0, y: 0 }, // Will be calculated by dagre
        data: {
          label: market.name,
          level: 'market',
          entityId: market.market_id,
          nodeId: marketNodeId,
          manager: market.manager ? `${market.manager.first_name} ${market.manager.last_name}` : null,
          childCount: regionCount,
          childType: 'regions',
          isSelected: selectedMarket === market.market_id,
          hasChildren: regionCount > 0,
          isExpanded,
          onClick: onNodeClick,
          onToggle: toggleNode
        }
      })

      // Add region nodes if market is expanded
      if (isExpanded) {
        const marketRegions = data.regions.filter(r => r.market_id === market.market_id)
        
        marketRegions.forEach((region) => {
          const regionNodeId = `region-${region.region_id}`
          const districtCount = data.districtCounts[region.region_id] || 0
          const isRegionExpanded = expandedNodes.has(regionNodeId)
          
          nodes.push({
            id: regionNodeId,
            type: 'orgNode',
            position: { x: 0, y: 0 },
            data: {
              label: region.name,
              level: 'region',
              entityId: region.region_id,
              nodeId: regionNodeId,
              manager: region.director ? `${region.director.first_name} ${region.director.last_name}` : null,
              childCount: districtCount,
              childType: 'districts',
              isSelected: selectedRegion === region.region_id,
              hasChildren: districtCount > 0,
              isExpanded: isRegionExpanded,
              onClick: onNodeClick,
              onToggle: toggleNode
            }
          })

          // Add edge from market to region
          edges.push({
            id: `${marketNodeId}-${regionNodeId}`,
            source: marketNodeId,
            target: regionNodeId,
            type: 'smoothstep',
            animated: false,
            style: {
              stroke: '#94a3b8',
              strokeWidth: 2,
            }
          })

          // Add district nodes if region is expanded
          if (isRegionExpanded) {
            const regionDistricts = data.districts.filter(d => d.region_id === region.region_id)
            
            regionDistricts.forEach((district) => {
              const districtNodeId = `district-${district.district_id}`
              
              nodes.push({
                id: districtNodeId,
                type: 'orgNode',
                position: { x: 0, y: 0 },
                data: {
                  label: district.name,
                  level: 'district',
                  entityId: district.district_id,
                  nodeId: districtNodeId,
                  manager: district.manager ? `${district.manager.first_name} ${district.manager.last_name}` : null,
                  childCount: district.location_count,
                  childType: 'locations',
                  isSelected: selectedDistrict === district.district_id,
                  hasChildren: false, // Don't show locations
                  isExpanded: false,
                  onClick: onNodeClick,
                  onToggle: toggleNode
                }
              })

              // Add edge from region to district
              edges.push({
                id: `${regionNodeId}-${districtNodeId}`,
                source: regionNodeId,
                target: districtNodeId,
                type: 'smoothstep',
                animated: false,
                style: {
                  stroke: '#94a3b8',
                  strokeWidth: 2,
                }
              })
            })
          }
        })
      }
    })

    // Apply hierarchical layout
    return getLayoutedElements(nodes, edges)
  }, [data, selectedMarket, selectedRegion, selectedDistrict, expandedNodes, onNodeClick, toggleNode])

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges)

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges])

  // Auto-fit view when significant changes occur
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ 
          padding: 0.1, 
          duration: 500,
          maxZoom: 1.2
        })
      }, 100)
    }
  }, [nodes.length, reactFlowInstance])

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.1, maxZoom: 1.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: {
            stroke: '#94a3b8',
            strokeWidth: 2,
          }
        }}
      >
        <Background color="#e5e7eb" gap={20} />
        <Controls 
          showFitView
          showZoom
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  )
}

// Wrapper component to provide ReactFlow context
export default function OrganizationChart(props: OrganizationChartProps) {
  return (
    <ReactFlowProvider>
      <OrganizationChartInner {...props} />
    </ReactFlowProvider>
  )
}