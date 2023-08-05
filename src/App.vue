<template>
  <header>
    Où est Alex ?
    <div>
      <button class="btn-icon" @click="questsStore.previousQuest">
        <font-awesome-icon icon="arrow-left" size="sm" />
      </button>
      {{ currentQuestIndex + 1 }} / {{ questsCount }}
      <button class="btn-icon" @click="questsStore.nextQuest">
        <font-awesome-icon icon="arrow-right" size="sm" />
      </button>
    </div>
  </header>
  <RouterView />
</template>


<script setup>
  import { useQuestsStore } from '@/stores/quests.js';
  import { storeToRefs } from 'pinia';

  const questsStore = useQuestsStore();
  const { currentQuestIndex, questsCount } = storeToRefs(questsStore);
</script>

<style lang="scss" scoped>
  #app{
    display: flex;
    flex-direction: column;
    
    header{
      padding: 1rem;
      display: flex;
      justify-content: space-between;

      .btn-icon{
        background: none;
        border: none;
      }

    }

    main{
      flex: 1;
    }

  }
</style>
