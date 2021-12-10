<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import SquareButton from '../components/SquareButton.svelte'

  import IconPlus from '../icons/plus.svg'
  import IconExport from '../icons/export.svg'
  import IconMinus from '../icons/minus.svg'
  import type { AtlasMap } from '../../types'

  let atlas: AtlasMap[] = []
  let localThemes = []

  function updateData() {
    messenger.sendMessage('getLocalThemes').then((r) => {
      localThemes = r
    })
    messenger.sendMessage('getAtlas').then((r) => {
      atlas = r
    })
  }

  updateData()

  $: showLocal = localThemes.length > 0

  const dispatch = createEventDispatcher()
</script>

<section class="scroll-box">
  <Header title="Theme Atlas">
    <SquareButton
      iconName={IconPlus}
      on:click={() => {
        dispatch('changeView', 'importMap')
      }}
    />
  </Header>
  {#if !showLocal && atlas.length < 1}
    <div class="nothing">Add a local theme or import a theme atlas.</div>
  {/if}
  {#if showLocal}
    <div id="localMap" class="singleItem">
      <span class="color-swatch">
        <span style="background-color: {localThemes[0]?.color}" />
        <span style="background-color: {localThemes[1]?.color}" />
        <span style="background-color: {localThemes[2]?.color}" />
        <span style="background-color: {localThemes[3]?.color}" />
      </span>
      <span class="label">Local Map</span>
      <SquareButton
        class="hiddenUntilHover"
        iconName={IconExport}
        on:click={() => {
          dispatch('changeView', 'exportMap')
        }}
      />
    </div>
  {/if}
  {#each atlas as map (map.mapId)}
    <div class="singleItem">
      <span class="color-swatch">
        <span style="background-color: {map.themes[0]?.color}" />
        <span style="background-color: {map.themes[1]?.color}" />
        <span style="background-color: {map.themes[2]?.color}" />
        <span style="background-color: {map.themes[3]?.color}" />
      </span>
      <span class="label">{map.mapName}</span>
      <SquareButton
        class="hiddenUntilHover"
        iconName={IconMinus}
        on:click={async () => {
          await messenger.sendMessage('deleteFromAtlas', { name: map.mapName })
          updateData()
        }}
      />
    </div>
  {/each}
</section>

<style lang="stylus">
  #localMap span
    color var(--black4)

  section
    flex-grow 1

  .nothing
    text-align center
    color var(--black4)
    margin var(--size-medium)
</style>
