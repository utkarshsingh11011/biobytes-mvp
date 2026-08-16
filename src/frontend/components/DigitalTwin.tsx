import React, { useMemo } from 'react'

const ORGAN_MAP: Record<string, string[]> = {
  brain: [],
  heart: ['CHOL', 'LDL', 'HDL', 'TRIG'],
  liver: ['SGPT', 'SGOT', 'BILI'],
  kidneys: ['CREAT', 'BUN', 'URIC'],
  pancreas: ['GLUC', 'HBA1C'],
}

const getOrganStatus = (organ: string, trends: any[]) => {
  const relatedBiomarkers = ORGAN_MAP[organ] || []
  let status = 'normal'
  let issues: any[] = []

  trends.forEach(trend => {
    const match = relatedBiomarkers.some(b => trend.code.toUpperCase().includes(b))
    if (match) {
      const latestPoint = trend.history && trend.history.length > 0 ? trend.history[trend.history.length - 1] : null
      if (latestPoint && trend.refMin !== null && trend.refMax !== null) {
        const val = latestPoint.value
        if (val < trend.refMin || val > trend.refMax) {
          const range = trend.refMax - trend.refMin
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

export default function DigitalTwin({ trends = [], gender = 'male' }: { trends: any[], gender?: string }) {
  const organs = useMemo(() => {
    const getColor = (status: string) => {
      if (status === 'critical') return 'bg-red-500 shadow-red-500/50'
      if (status === 'warning') return 'bg-amber-500 shadow-amber-500/50'
      return 'bg-emerald-500 shadow-emerald-500/50'
    }

    return [
      { id: 'brain', label: 'Brain / Neuro', top: '15%', left: '50%', ...getOrganStatus('brain', trends) },
      { id: 'heart', label: 'Heart & Lipids', top: '35%', left: '55%', ...getOrganStatus('heart', trends) },
      { id: 'liver', label: 'Liver (Hepatic)', top: '48%', left: '42%', ...getOrganStatus('liver', trends) },
      { id: 'pancreas', label: 'Pancreas', top: '52%', left: '50%', ...getOrganStatus('pancreas', trends) },
      { id: 'kidneys', label: 'Kidneys (Renal)', top: '58%', left: '40%', ...getOrganStatus('kidneys', trends) }
    ].map(organ => ({
      ...organ,
      colorClass: getColor(organ.status),
      pulseClass: organ.status === 'critical' ? 'animate-ping' : ''
    }))
  }, [trends])

  const isFemale = gender === 'female'

  return (
    <div className="w-full h-[550px] relative bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-border/50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
          Interactive Digital Twin (2D)
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">Hover over organs for biomarker insights</p>
      </div>

      {/* Abstract 2D Mannequin */}
      <div className={`relative w-[280px] h-[480px] flex flex-col items-center ${isFemale ? 'scale-95' : 'scale-100'} transition-transform duration-500 mt-8`}>
        
        {/* Head */}
        <div className="w-20 h-24 rounded-[40%] bg-primary/10 backdrop-blur-md border-2 border-primary/20 z-20 shadow-inner" />
        
        {/* Neck */}
        <div className="w-8 h-8 -mt-2 bg-primary/10 backdrop-blur-md border-x-2 border-primary/20 z-10" />

        {/* Torso Group */}
        <div className="relative flex flex-col items-center z-20">
          {/* Shoulders & Upper Torso */}
          <div className={`${isFemale ? 'w-36' : 'w-44'} h-32 rounded-t-[3rem] rounded-b-2xl bg-primary/10 backdrop-blur-md border-2 border-primary/20 shadow-inner transition-all duration-500`} />
          
          {/* Lower Torso / Hips */}
          <div className={`${isFemale ? 'w-40' : 'w-36'} h-24 -mt-4 rounded-b-[2.5rem] rounded-t-xl bg-primary/10 backdrop-blur-md border-2 border-primary/20 shadow-inner transition-all duration-500`} />
          
          {/* Left Arm */}
          <div className={`absolute top-2 ${isFemale ? '-left-8' : '-left-10'} w-10 h-44 rounded-full bg-primary/10 backdrop-blur-md border-2 border-primary/20 origin-top rotate-[15deg] shadow-inner transition-all duration-500`} />
          
          {/* Right Arm */}
          <div className={`absolute top-2 ${isFemale ? '-right-8' : '-right-10'} w-10 h-44 rounded-full bg-primary/10 backdrop-blur-md border-2 border-primary/20 origin-top -rotate-[15deg] shadow-inner transition-all duration-500`} />
        </div>

        {/* Legs Group */}
        <div className="flex gap-4 -mt-6 z-10">
          {/* Left Leg */}
          <div className={`w-12 h-48 rounded-full bg-primary/10 backdrop-blur-md border-2 border-primary/20 shadow-inner ${isFemale ? 'ml-2' : ''} transition-all duration-500`} />
          {/* Right Leg */}
          <div className={`w-12 h-48 rounded-full bg-primary/10 backdrop-blur-md border-2 border-primary/20 shadow-inner ${isFemale ? 'mr-2' : ''} transition-all duration-500`} />
        </div>

        {/* --- ORGANS OVERLAY --- */}
        {/* The organs map uses absolute positioning relative to the entire mannequin container (280x480) */}
        {organs.map((organ) => (
          <div key={organ.id} className="absolute z-30 group" style={{ top: organ.top, left: organ.left, transform: 'translate(-50%, -50%)' }}>
            
            {/* The pulsing ring (if critical) */}
            {organ.pulseClass && (
              <div className={`absolute inset-0 rounded-full opacity-75 ${organ.colorClass} ${organ.pulseClass}`} />
            )}
            
            {/* The organ dot */}
            <div className={`relative w-6 h-6 rounded-full border-2 border-white cursor-pointer shadow-lg transition-transform hover:scale-125 ${organ.colorClass}`} />

            {/* Hover Tooltip (Glassmorphism) */}
            <div className="absolute top-1/2 left-full ml-4 -translate-y-1/2 w-48 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 z-50">
              <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl">
                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1">{organ.label}</p>
                <div className="flex items-center text-xs mb-2">
                  <span className={`w-2 h-2 rounded-full mr-1 ${organ.colorClass.split(' ')[0]}`}></span>
                  <span className="capitalize font-medium text-slate-600 dark:text-slate-300">{organ.status}</span>
                </div>
                
                {organ.issues.length > 0 ? (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    {organ.issues.map((issue: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{issue.name}</span>
                        <span className={issue.status === 'critical' ? 'text-red-500 font-bold' : 'text-amber-500 font-bold'}>
                          {issue.value} {issue.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    All linked biomarkers are within normal range.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm pointer-events-none">
        <div className="flex items-center text-xs font-medium dark:text-slate-200"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-sm shadow-emerald-500/50"></span> Normal Range</div>
        <div className="flex items-center text-xs font-medium dark:text-slate-200"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2 shadow-sm shadow-amber-500/50"></span> Elevated / Borderline</div>
        <div className="flex items-center text-xs font-medium dark:text-slate-200"><span className="w-3 h-3 rounded-full bg-red-500 mr-2 shadow-sm shadow-red-500/50"></span> Critical</div>
      </div>
    </div>
  )
}
