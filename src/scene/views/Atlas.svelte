<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import SquareButton from '../components/SquareButton.svelte'

  import IconPlus from '../icons/plus.svg'
  import IconExport from '../icons/export.svg'
  import IconMinus from '../icons/minus.svg'

  export let atlas: any[]
  export let showLocal = true

  const dispatch = createEventDispatcher()
</script>

<style lang="stylus">
  #localMap span
    color var(--black4)
</style>

<section>
  <Header title="Theme Atlas">
    <SquareButton
      iconName={IconPlus}
      on:click={() => {
        dispatch('changeView', 'importMap')
      }} />
  </Header>
  {#if showLocal}
    <div id="localMap" class="singleItem">
      <span class="label">Local Map</span>
      <SquareButton
        class="hiddenUntilHover"
        iconName={IconExport}
        on:click={() => {
          dispatch('changeView', 'exportMap')
        }} />
    </div>
  {/if}
  {#each atlas as map (map.mapName)}
    <div class="singleItem">
      <span class="label">{map.mapName}</span>
      <SquareButton
        class="hiddenUntilHover"
        iconName={IconMinus}
        on:click={async () => {
          await messenger.sendMessage('deleteFromAtlas', { name: map.mapName })
          dispatch('changeView')
        }} />
    </div>
  {/each}
</section>
