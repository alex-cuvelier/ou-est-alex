<template>
  <header>
    Où est Alex ?
    <div>
      {{ currentQuestIndex + 1 }} / {{ questsCount }}
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
    }

    main{
      flex: 1;
    }

  }
</style>
