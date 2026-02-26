import React from 'react'

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden">
      {/* Base gradient from navy to darker navy */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-light to-navy-dark"></div>

      {/* Top left circular glow - lighter navy */}
      <div
        className="absolute top-0 -left-20 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #4F7AB3 0%, #1E3A8A 40%, #0A192F 70%, transparent 90%)',
        }}
      />

      {/* Top right circular glow - medium navy */}
      <div
        className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 70% 20%, #3B5F9E 0%, #1E3A8A 50%, #0A192F 80%, transparent 95%)',
        }}
      />

      {/* Center circular glow - deep navy */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2D4A8A 0%, #0F2A4A 50%, #0A192F 80%, transparent 95%)',
        }}
      />

      {/* Bottom left circular glow - darker navy */}
      <div
        className="absolute bottom-0 -left-10 w-[550px] h-[550px] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 40% 70%, #1E3A8A 0%, #0F2A4A 40%, #020C1B 70%, transparent 90%)',
        }}
      />

      {/* Bottom right circular glow - darkest navy */}
      <div
        className="absolute bottom-20 -right-10 w-[600px] h-[600px] rounded-full opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 60% 80%, #0F2A4A 0%, #020C1B 50%, #020C1B 80%, transparent 95%)',
        }}
      />

      {/* Additional bottom center glow for depth */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 50% 100%, #112240 0%, #0A192F 50%, transparent 90%)',
        }}
      />

      {/* Very subtle noise overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '150px 150px'
        }}
      />
    </div>
  )
}

export default Background
