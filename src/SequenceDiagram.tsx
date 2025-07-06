import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface SequenceDiagramProps {
  title: string;
  diagramDefinition: string;
  idPrefix?: string;
}

export const SequenceDiagram: React.FC<SequenceDiagramProps> = ({ title, diagramDefinition, idPrefix = 'diagram' }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current) return;

      mermaid.initialize({ 
        startOnLoad: false, 
        theme: 'default',
        sequence: {
          useMaxWidth: true,
          wrap: true
        }
      });

      try {
        const { svg } = await mermaid.render(`${idPrefix}-${Date.now()}`, diagramDefinition);
        elementRef.current.innerHTML = svg;
        
        // Ensure SVG stays within container bounds
        const svgElement = elementRef.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
      } catch (error) {
        console.error('Mermaid error:', error);
        elementRef.current.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Payment Flow: User ↔ Server</div>';
      }
    };

    renderDiagram();
  }, [diagramDefinition, idPrefix]);

  return (
    <div 
      style={{
        margin: '16px auto',
        padding: '16px',
        backgroundColor: '#e8f4f8',
        borderRadius: '8px',
        border: '1px solid #bee5eb',
        textAlign: 'center',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ fontWeight: 'bold', marginBottom: '12px', fontSize: '14px' }}>
        {title}
      </div>
      <div 
        ref={elementRef} 
        style={{ 
          minHeight: '600px', 
          width: '100%', 
          overflow: 'hidden',
          textAlign: 'center'
        }} 
      />
    </div>
  );
}; 