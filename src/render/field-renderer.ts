import type { NormalizedLineageNode } from "../graph/types.js";
import type { RenderNode } from "./types.js";
import { createSvgElement } from "./svg-dom.js";

const titleOnlyHeaderHeight = 48;
const subtitleHeaderHeight = 68;
const fieldRowHeight = 28;
const dataTypeWidth = 64;
const horizontalPadding = 16;
const columnGap = 8;

export function measureNodeHeight(node: NormalizedLineageNode, minimumHeight: number): number {
  if (!hasVisibleFields(node)) return minimumHeight;
  return Math.max(minimumHeight, headerHeight(node) + node.fields.length * fieldRowHeight);
}

export class FieldRenderer {
  render(group: SVGGElement, item: RenderNode, clipIdPrefix: string): void {
    const fields = item.node.fields;
    if (fields === undefined || fields.length === 0) return;
    const header = headerHeight(item.node);
    const separator = createSvgElement("line");
    separator.setAttribute("class", "field-separator");
    separator.setAttribute("x1", "0");
    separator.setAttribute("x2", String(item.width));
    separator.setAttribute("y1", String(header));
    separator.setAttribute("y2", String(header));
    group.append(separator);

    const fieldGroup = createSvgElement("g");
    fieldGroup.setAttribute("class", "fields");
    for (const [index, field] of fields.entries()) {
      const row = createSvgElement("g");
      row.setAttribute("class", "field-row");
      row.setAttribute("data-field-id", field.id);
      const baseline = header + index * fieldRowHeight + 19;
      const label = createSvgElement("text");
      label.setAttribute("class", "field-name");
      label.setAttribute("x", String(horizontalPadding));
      label.setAttribute("y", String(baseline));
      const reservedDataTypeWidth = field.dataType === undefined ? 0 : dataTypeWidth + columnGap;
      label.setAttribute(
        "clip-path",
        `url(#${appendClipPath(
          group,
          `${clipIdPrefix}-field-name-${index}`,
          horizontalPadding,
          Math.max(0, item.width - horizontalPadding * 2 - reservedDataTypeWidth),
          header + index * fieldRowHeight,
          fieldRowHeight,
        )})`,
      );
      label.textContent = field.label ?? field.id;
      row.append(label);
      if (field.dataType !== undefined) {
        const dataType = createSvgElement("text");
        dataType.setAttribute("class", "field-data-type");
        dataType.setAttribute("x", String(item.width - horizontalPadding));
        dataType.setAttribute("y", String(baseline));
        dataType.setAttribute("text-anchor", "end");
        dataType.setAttribute(
          "clip-path",
          `url(#${appendClipPath(
            group,
            `${clipIdPrefix}-field-type-${index}`,
            Math.max(0, item.width - horizontalPadding - dataTypeWidth),
            dataTypeWidth,
            header + index * fieldRowHeight,
            fieldRowHeight,
          )})`,
        );
        dataType.textContent = field.dataType;
        row.append(dataType);
      }
      const tooltip = createSvgElement("title");
      tooltip.textContent = fieldTooltip(field);
      row.append(tooltip);
      fieldGroup.append(row);
    }
    group.append(fieldGroup);
  }
}

function hasVisibleFields(
  node: NormalizedLineageNode,
): node is NormalizedLineageNode & { fields: NonNullable<NormalizedLineageNode["fields"]> } {
  return node.fields !== undefined && node.fields.length > 0;
}

function headerHeight(node: NormalizedLineageNode): number {
  return node.subtitle === undefined ? titleOnlyHeaderHeight : subtitleHeaderHeight;
}

function appendClipPath(
  group: SVGGElement,
  id: string,
  x: number,
  width: number,
  y: number,
  height: number,
): string {
  const clipPath = createSvgElement("clipPath");
  clipPath.setAttribute("id", id);
  const rect = createSvgElement("rect");
  rect.setAttribute("x", String(x));
  rect.setAttribute("y", String(y));
  rect.setAttribute("width", String(width));
  rect.setAttribute("height", String(height));
  clipPath.append(rect);
  group.append(clipPath);
  return id;
}

function fieldTooltip(field: NonNullable<NormalizedLineageNode["fields"]>[number]): string {
  const label = field.label ?? field.id;
  const heading = field.dataType === undefined ? label : `${label} (${field.dataType})`;
  return field.description === undefined ? heading : `${heading}\n${field.description}`;
}
