import { Card, CardContent } from "../ui/card"

interface WorldMapCardProps {
  title: string
  description: string
}

export function WorldMapCard({ title, description }: WorldMapCardProps) {
  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardContent className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-40 h-40 rounded-full border-4 border-[#6475e9] overflow-hidden">
            <img
              src="/profile-placeholderr.jpeg"
              alt="Profile placeholder"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">{title}</h3>
          <p className="text-sm text-[#64707d] mb-4">{description}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ height: '128px', backgroundColor: '#F3F3F3' }}
            >
              <div
                className="absolute bottom-0 w-full transition-all duration-300"
                style={{
                  height: '25%',
                  backgroundColor: '#a2acf2',
                  minHeight: '40px'
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#1e1e1e]">OPNS</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ height: '128px', backgroundColor: '#F3F3F3' }}
            >
              <div
                className="absolute bottom-0 w-full transition-all duration-300"
                style={{
                  height: '37.5%',
                  backgroundColor: '#6475e9',
                  minHeight: '65px'
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#1e1e1e]">CONS</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ height: '128px', backgroundColor: '#F3F3F3' }}
            >
              <div
                className="absolute bottom-0 w-full transition-all duration-300"
                style={{
                  height: '50%',
                  backgroundColor: '#a2acf2',
                  minHeight: '34px'
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#1e1e1e]">EXTN</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ height: '128px', backgroundColor: '#F3F3F3' }}
            >
              <div
                className="absolute bottom-0 w-full transition-all duration-300"
                style={{
                  height: '31.25%',
                  backgroundColor: '#6475e9',
                  minHeight: '87px'
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#1e1e1e]">AGRS</span>
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{ height: '128px', backgroundColor: '#F3F3F3' }}
            >
              <div
                className="absolute bottom-0 w-full transition-all duration-300"
                style={{
                  height: '18.75%',
                  backgroundColor: '#a2acf2',
                  minHeight: '67px'
                }}
              />
            </div>
            <span className="text-xs font-medium text-[#1e1e1e]">NESM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
