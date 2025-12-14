import { useMemo, useState } from "react";
import { QdrantDocument } from "@/types/document";
import { Sparkles, Maximize2, Minimize2 } from "lucide-react";

interface EmbeddingVisualizerProps {
  documents: QdrantDocument[];
}

export function EmbeddingVisualizer({ documents }: EmbeddingVisualizerProps) {
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const visualData = useMemo(() => {
    if (documents.length === 0) return [];
    
    return documents.slice(0, expanded ? 30 : 15).map((doc) => {
      const embedding = doc.embedding.slice(0, 64);
      const magnitude = Math.sqrt(embedding.reduce((acc, val) => acc + val * val, 0));
      
      return {
        id: doc.metadata.external_id,
        title: doc.metadata.title,
        values: embedding,
        magnitude,
      };
    });
  }, [documents, expanded]);

  const getColor = (value: number, index: number, isHovered: boolean) => {
    const normalized = (value + 1) / 2;
    const hueShift = (index / 64) * 60;
    const baseHue = 200 + hueShift;
    const saturation = isHovered ? 85 : 70;
    const lightness = 35 + normalized * 35;
    
    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`;
  };

  const getBarHeight = (value: number) => {
    const normalized = Math.abs(value);
    return Math.max(4, normalized * 28 + 4);
  };

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-primary/50" />
          </div>
          <p className="text-muted-foreground">Upload documents to visualize embeddings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Embedding Space</h3>
              <p className="text-xs text-muted-foreground">
                {visualData.length} vectors • 64 dimensions
              </p>
            </div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      {/* Visualization */}
      <div className="p-6">
        <div className="space-y-2 overflow-x-auto pb-2">
          {visualData.map((doc, docIndex) => {
            const isHovered = hoveredDoc === doc.id;
            
            return (
              <div
                key={doc.id}
                className={`group flex items-end gap-3 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  isHovered ? 'bg-primary/5' : 'hover:bg-muted/30'
                }`}
                onMouseEnter={() => setHoveredDoc(doc.id)}
                onMouseLeave={() => setHoveredDoc(null)}
                style={{
                  animationDelay: `${docIndex * 50}ms`,
                }}
              >
                {/* Document info */}
                <div className="w-32 shrink-0">
                  <p className={`text-xs font-medium truncate transition-colors ${
                    isHovered ? 'text-primary' : 'text-foreground'
                  }`}>
                    {doc.title.slice(0, 20)}...
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    mag: {doc.magnitude.toFixed(2)}
                  </p>
                </div>
                
                {/* Bars visualization */}
                <div className="flex items-end gap-[2px] h-8">
                  {doc.values.map((val, i) => (
                    <div
                      key={i}
                      className="rounded-t-sm transition-all duration-200"
                      style={{
                        backgroundColor: getColor(val, i, isHovered),
                        height: `${getBarHeight(val)}px`,
                        width: isHovered ? '4px' : '3px',
                        opacity: isHovered ? 1 : 0.8,
                        transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                        boxShadow: isHovered ? `0 0 8px ${getColor(val, i, true)}40` : 'none',
                      }}
                      title={`dim[${i}]: ${val.toFixed(4)}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-3 border-t border-border bg-muted/20">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="h-3 w-16 rounded-full overflow-hidden"
                style={{ 
                  background: 'linear-gradient(90deg, hsl(200, 70%, 35%), hsl(230, 70%, 50%), hsl(260, 70%, 60%))' 
                }} 
              />
              <span className="font-mono">-1.0 → +1.0</span>
            </div>
          </div>
          <span className="font-mono">
            {documents.length > visualData.length && `+${documents.length - visualData.length} more`}
          </span>
        </div>
      </div>
    </div>
  );
}
