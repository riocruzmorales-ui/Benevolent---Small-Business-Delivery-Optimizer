
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { OptimizedStop } from '../types';

interface MapViewProps {
  stops: OptimizedStop[];
  depot: string;
}

export const MapView: React.FC<MapViewProps> = ({ stops, depot }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || stops.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 400;
    const height = container?.clientHeight || 400;
    const padding = 50;

    // Filter out stops without lat/lng for scaling
    const validStops = stops.filter(s => s.lat !== undefined && s.lng !== undefined);
    if (validStops.length === 0) return;

    const xExtent = d3.extent(validStops, d => d.lng as number) as [number, number];
    const yExtent = d3.extent(validStops, d => d.lat as number) as [number, number];

    const xScale = d3.scaleLinear().domain(xExtent).range([padding, width - padding]);
    const yScale = d3.scaleLinear().domain(yExtent).range([height - padding, padding]);

    // Draw the path connecting the stops
    const line = d3.line<OptimizedStop>()
      .x(d => xScale(d.lng || 0))
      .y(d => yScale(d.lat || 0))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Background path (the full planned route)
    svg.append("path")
      .datum(stops)
      .attr("fill", "none")
      .attr("stroke", "#334155")
      .attr("stroke-width", 4)
      .attr("stroke-linecap", "round")
      .attr("d", line);

    // Active path (portion not yet completed or just highlighted)
    // For a prototype, we just draw the main line with a distinct style
    svg.append("path")
      .datum(stops)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "8,4")
      .attr("d", line);

    // Draw dots for each stop
    const nodes = svg.selectAll(".node")
      .data(stops)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${xScale(d.lng || 0)}, ${yScale(d.lat || 0)})`);

    // Circle background/border
    nodes.append("circle")
      .attr("r", (d, i) => i === 0 ? 12 : 10)
      .attr("fill", (d, i) => {
        if (d.isCompleted) return "#1e293b"; // Dimmed if completed
        if (i === 0) return "#10b981"; // Depot color
        return "#f59e0b"; // Standard stop color
      })
      .attr("stroke", (d) => d.isCompleted ? "#475569" : "#0f172a")
      .attr("stroke-width", 2)
      .attr("class", "transition-all duration-300");

    // Checkmark or Number
    nodes.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", (d) => d.isCompleted ? "#64748b" : "#0f172a")
      .attr("font-size", "10px")
      .attr("font-weight", "900")
      .attr("font-family", "sans-serif")
      .text((d, i) => {
        if (d.isCompleted) return "✓";
        return i === 0 ? "H" : i.toString();
      });

    // Address Labels
    nodes.append("text")
      .text((d, i) => i === 0 ? "DEPOT" : `STOP ${i}`)
      .attr("y", -18)
      .attr("text-anchor", "middle")
      .attr("fill", (d) => d.isCompleted ? "#475569" : "#94a3b8")
      .attr("font-size", "9px")
      .attr("font-weight", "bold")
      .attr("letter-spacing", "0.1em");

  }, [stops]);

  return (
    <div className="w-full h-full min-h-[300px] relative overflow-hidden bg-slate-900/40 rounded-3xl">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
