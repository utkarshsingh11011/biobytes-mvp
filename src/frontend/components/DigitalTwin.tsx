"use client"

import React, { useState, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Html, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'

// Mapping biomarkers to their respective organs
const ORGAN_MAP: Record<string, string[]> = {
  brain: [], // No current biomarkers for brain, just visual completeness
  heart: ['CHOL', 'LDL', 'HDL', 'TRIG'],
  liver: ['SGPT', 'SGOT', 'BILI'],
  kidneys: ['CREAT', 'BUN', 'URIC'],
  pancreas: ['GLUC', 'HBA1C'],
}

// Helper to determine organ status based on trends
const getOrganStatus = (organ: string, trends: any[]) => {
  const relatedBiomarkers = ORGAN_MAP[organ] || []
  let status = 'normal' // normal, warning, critical
  let issues: any[] = []

  trends.forEach(trend => {
    // Some codes might be subsets, e.g. "GLUC-F" or "SGPT"
    const match = relatedBiomarkers.some(b => trend.code.toUpperCase().includes(b))
    if (match) {
      const latestPoint = trend.history && trend.history.length > 0 ? trend.history[trend.history.length - 1] : null
      if (latestPoint && trend.refMin !== null && trend.refMax !== null) {
        const val = latestPoint.value
        if (val < trend.refMin || val > trend.refMax) {
          // Check if it's way out of bounds (critical) or just slightly (warning)
          const range = trend.refMax - trend.refMin
          // Avoid division by zero
          const variance = range === 0 ? 0.2 : Math.max(trend.refMin - val, val - trend.refMax) / range
          
          if (variance > 0.15) {
            status = 'critical'
          } else if (status !== 'critical') {
            status = 'warning'
          }
          issues.push({ name: trend.name, value: val, unit: trend.unit, status: variance > 0.15 ? 'critical' : 'warning' })
        }
      }
    }
  })

  return { status, issues }
}

const OrganMesh = ({ position, color, label, status, issues, geometryArgs, geometryType }: any) => {
  const [hovered, setHover] = useState(false)
  const mesh = useRef<THREE.Mesh>(null)

  // Floating animation
  useFrame((state) => {
    if (mesh.current) {
      mesh.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.05
    }
  })

  return (
    <group position={position}>
      <mesh
        ref={mesh}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        castShadow
      >
        {geometryType === 'sphere' && <sphereGeometry args={geometryArgs} />}
        {geometryType === 'box' && <boxGeometry args={geometryArgs} />}
        {geometryType === 'capsule' && <capsuleGeometry args={geometryArgs} />}
        
        <meshStandardMaterial 
          color={color} 
          emissive={status === 'critical' ? color : '#000000'}
          emissiveIntensity={hovered || status === 'critical' ? 0.6 : 0.1}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Label and Tooltip */}
      {hovered && (
        <Html position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-2xl border border-slate-200 pointer-events-none min-w-[200px] transition-all animate-in zoom-in-95 duration-200">
            <h4 className="font-bold text-slate-800 capitalize border-b pb-1 mb-2">{label}</h4>
            {issues.length > 0 ? (
              <div className="space-y-1">
                {issues.map((issue: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600 font-medium">{issue.name}</span>
                    <span className={`font-bold ${issue.status === 'critical' ? 'text-red-500' : 'text-amber-500'}`}>
                      {issue.value} <span className="text-[10px] text-slate-400 font-normal">{issue.unit}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-600 font-medium flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                Healthy & Normal
              </p>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function DigitalTwin({ trends = [] }: { trends: any[] }) {
  // Map organs to their calculated status based on patient data
  const organs = useMemo(() => {
    const getColor = (status: string) => {
      if (status === 'critical') return '#EF4444' // Red
      if (status === 'warning') return '#F59E0B' // Amber
      return '#66A573' // Vitality Green
    }

    return [
      {
        id: 'brain',
        label: 'Brain',
        position: [0, 4, 0],
        geometryType: 'sphere',
        geometryArgs: [0.8, 32, 32],
        ...getOrganStatus('brain', trends)
      },
      {
        id: 'heart',
        label: 'Heart (Lipids)',
        position: [-0.4, 2, 0.2],
        geometryType: 'sphere',
        geometryArgs: [0.6, 32, 32],
        ...getOrganStatus('heart', trends)
      },
      {
        id: 'liver',
        label: 'Liver (Hepatic)',
        position: [0.5, 1.2, 0],
        geometryType: 'capsule',
        geometryArgs: [0.4, 0.8, 4, 16],
        ...getOrganStatus('liver', trends)
      },
      {
        id: 'kidneys',
        label: 'Kidneys (Renal)',
        position: [0, 0, -0.4],
        geometryType: 'box',
        geometryArgs: [1.2, 0.6, 0.4],
        ...getOrganStatus('kidneys', trends)
      },
      {
        id: 'pancreas',
        label: 'Pancreas (Endocrine)',
        position: [0, 0.5, 0],
        geometryType: 'capsule',
        geometryArgs: [0.2, 0.6, 4, 16],
        ...getOrganStatus('pancreas', trends)
      }
    ].map(organ => ({
      ...organ,
      color: getColor(organ.status)
    }))
  }, [trends])

  return (
    <div className="w-full h-[500px] relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-border/50">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
          Interactive Digital Twin
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hover over organs for biomarker insights</p>
      </div>

      <Canvas camera={{ position: [0, 2, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {/* Placeholder human body outline (glassmorphism style) */}
        <mesh position={[0, 1.5, 0]}>
          <capsuleGeometry args={[1.5, 4, 4, 16]} />
          <meshPhysicalMaterial 
            color="#4DA1A9" 
            transparent 
            opacity={0.1} 
            roughness={0.1}
            transmission={0.9}
            thickness={2}
          />
        </mesh>

        {/* Dynamic Organs */}
        {organs.map((organ) => (
          <OrganMesh key={organ.id} {...organ} />
        ))}

        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
        <OrbitControls 
          enableZoom={true} 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2} 
          autoRotate 
          autoRotateSpeed={1}
        />
        <Environment preset="city" />
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 pointer-events-none shadow-sm">
        <div className="flex items-center text-xs font-medium"><span className="w-3 h-3 rounded-full bg-[#66A573] mr-2"></span> Normal Range</div>
        <div className="flex items-center text-xs font-medium"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Elevated / Borderline</div>
        <div className="flex items-center text-xs font-medium"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Critical</div>
      </div>
    </div>
  )
}
