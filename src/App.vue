<template>
  <div class="page">
    <h1>Lets check out your Emotion</h1>
    <div class="text-center" v-if="!ready">Loading....</div>
    <div id="app-container">
      <video id="video" autoplay muted playsinline></video>
      <div class="bottom-container" v-if="ready">
        <div class="emotions">
          <div class="emotion-item" v-for="em in EMOTIONS">
            <div class="emotion-text">{{ em.label }} : {{ calPercent(data[em.key]) }}%</div>
            <div class="emotion-bg" :style="getItemStyle(em)"></div>
          </div>
        </div>
        <button class="action-btn play" v-if="isPaused" @click="start"></button>
        <button class="action-btn" v-else @click="close"></button>

        <transition name="slide-fade" mode="out-in" appear>
          <div class="emoji" :key="emoji">{{ emoji }}</div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import useEmotion, { EMOTIONS } from "./useEmotion";

const ready = ref(false);
const isPaused = ref(false);
const emoji = ref("");
const data = ref<any>({});

function getItemStyle(emotion: (typeof EMOTIONS)[number]) {
  const value = data.value && data.value[emotion.key];
  if (!value) return;
  return {
    width: `${calPercent(value)}%`,
    backgroundColor: emotion.color,
  };
}

function calPercent(value: any) {
  if (typeof value !== "number") return (0).toFixed(2);
  return (value * 100).toFixed(2);
}

function updateEmotions(results: any, emotion: (typeof EMOTIONS)[number]) {
  if (!results || !results.expressions) return;
  emoji.value = emotion.emoji;
  data.value = results.expressions;
  ready.value = true;
}

function close() {
  emotion?.stop();
  isPaused.value = true;
}

function start() {
  emotion?.start();
  isPaused.value = false;
}

let emotion: ReturnType<typeof useEmotion> | null = null;
onMounted(async () => {
  emotion = useEmotion(updateEmotions);
  start();
});

onBeforeUnmount(() => {
  emotion?.stop();
});
</script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease;
}

.slide-fade-leave-active {
  transition: all 0.25s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter,
.slide-fade-leave-to {
  transform: translateY(100%);
  scale: 0.5;
  opacity: 0;
}
</style>
