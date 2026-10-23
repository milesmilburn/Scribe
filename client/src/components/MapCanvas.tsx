import { useCallback, useRef, useState } from 'react';
import { Application, extend, useApplication } from '@pixi/react';
import { Container, FederatedPointerEvent, Graphics, Sprite, Text } from 'pixi.js';
import { MAP_HEIGHT, MAP_WIDTH } from '../config';
import { useSessionStore } from '../stores/useSessionStore';
import type { Token } from '../interfaces/Token';

extend({ Container, Graphics, Sprite, Text });

const GRID_SIZE = 50;
const TOKEN_RADIUS = 20;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function drawGrid(g: Graphics) {
  g.clear();

  // Map background
  g.rect(0, 0, MAP_WIDTH, MAP_HEIGHT).fill({ color: 0x2a2f3a });

  // Vertical lines
  for (let x = 0; x <= MAP_WIDTH; x += GRID_SIZE) {
    g.moveTo(x, 0).lineTo(x, MAP_HEIGHT);
  }
  // Horizontal lines
  for (let y = 0; y <= MAP_HEIGHT; y += GRID_SIZE) {
    g.moveTo(0, y).lineTo(MAP_WIDTH, y);
  }

  // One stroke call draws every line above
  g.stroke({ width: 1, color: 0xffffff, alpha: 0.15 });
}

type MoveHandler = (tokenId: number, x: number, y: number) => Promise<void>;

function TokenView({ token, draggable, onMove }: { token: Token; draggable: boolean; onMove: MoveHandler }) {
  const { app } = useApplication();
  const containerRef = useRef<Container>(null);
  // Local position while dragging; null when not dragging
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);

  const drawCircle = useCallback(
    (g: Graphics) => {
      g.clear();
      g.circle(0, 0, TOKEN_RADIUS)
        .fill({ color: token.color })
        .stroke({ width: 2, color: 0x000000, alpha: 0.6 });
    },
    [token.color]
  );

  const handlePointerDown = useCallback(
    (e: FederatedPointerEvent) => {
      const parent = containerRef.current?.parent;
      if (!draggable || !parent) return;

      // Pointer position in world units
      const start = parent.toLocal(e.global);
      const offsetX = start.x - token.x;
      const offsetY = start.y - token.y;
      let last = { x: token.x, y: token.y };

      const onPointerMove = (ev: FederatedPointerEvent) => {
        const p = parent.toLocal(ev.global);
        last = {
          x: clamp(p.x - offsetX, 0, MAP_WIDTH),
          y: clamp(p.y - offsetY, 0, MAP_HEIGHT),
        };
        setDragPos(last);
      };

      const onPointerUp = async () => {
        app.stage.off('globalpointermove', onPointerMove);
        app.stage.off('pointerup', onPointerUp);
        app.stage.off('pointerupoutside', onPointerUp);
        try {
          await onMove(token.tokenId, last.x, last.y);
        } finally {
          setDragPos(null); 
        }
      };

      // Listen on the stage so the drag continues even when the cursor leaves the token
      app.stage.eventMode = 'static';
      app.stage.hitArea = app.screen;
      app.stage.on('globalpointermove', onPointerMove);
      app.stage.on('pointerup', onPointerUp);
      app.stage.on('pointerupoutside', onPointerUp);

      setDragPos(last);
    },
    [app, draggable, onMove, token.tokenId, token.x, token.y]
  );

  const pos = dragPos ?? token;

  return (
    <pixiContainer
      ref={containerRef}
      x={pos.x}
      y={pos.y}
      alpha={dragPos ? 0.7 : 1}
      eventMode="static"
      cursor={draggable ? 'grab' : 'default'}
      onPointerDown={handlePointerDown}
    >
      <pixiGraphics draw={drawCircle} />
      <pixiText text={token.label} anchor={0.5} y={TOKEN_RADIUS + 12} style={{ fill: 0xffffff, fontSize: 14 }} />
    </pixiContainer>
  );
}

export default function MapCanvas({ canDrag, onTokenMove }: { canDrag: boolean; onTokenMove: MoveHandler }) {
  const tokens = useSessionStore((s) => s.tokens);

  return (
    <Application width={MAP_WIDTH} height={MAP_HEIGHT} backgroundColor={0x1099bb}>
      <pixiGraphics draw={drawGrid} />
      {tokens.map((t) => (
        <TokenView key={t.tokenId} token={t} draggable={canDrag} onMove={onTokenMove} />
      ))}
    </Application>
  );
}