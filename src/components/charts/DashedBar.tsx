// Shared custom bar shape for dashed "expected/forecasted" candles
const DashedBar = (props: any) => {
  const { x, y, width, height, color } = props;
  if (!height || height === 0) return null;
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={color}
      fillOpacity={0.18}
      stroke={color}
      strokeWidth={1.5}
      strokeDasharray="6 3"
      rx={2}
      ry={2}
    />
  );
};

export default DashedBar;
