<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import "lineage-viewer/define";
import type { LineageViewerElement } from "lineage-viewer";
import "./style.css";

const host = ref<HTMLDivElement>();
let viewer: LineageViewerElement | undefined;

onMounted(() => {
  if (!host.value) return;

  viewer = document.createElement("lineage-viewer") as LineageViewerElement;
  viewer.options = { fitOnLoad: true, direction: "LR" };
  viewer.data = {
    schemaVersion: "1.0",
    nodes: [
      { id: "orders", label: "Orders", subtitle: "Source table" },
      { id: "clean-orders", label: "Clean orders", subtitle: "ETL transform" },
      { id: "daily-sales", label: "Daily sales", subtitle: "Analytics dataset" },
    ],
    edges: [
      { id: "orders-to-clean", source: "orders", target: "clean-orders", label: "clean" },
      { id: "clean-to-sales", source: "clean-orders", target: "daily-sales", label: "aggregate" },
    ],
  };
  host.value.append(viewer);
});

onUnmounted(() => viewer?.destroy());
</script>

<template>
  <div ref="host" class="viewer-host" />
</template>
