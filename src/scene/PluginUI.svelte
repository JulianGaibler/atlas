<script lang="ts">
  import formatDistance from 'date-fns/formatDistance'
  import { messenger, progressStatus, updatedLocalMap } from './store'
  import type { AtlasError } from '../errors'

  // Navigation
  import NavigationBar from './views/NavigationBar.svelte'
  //Selection
  import Selection from './views/Selection.svelte'
  // Themes
  import Themes from './views/Themes.svelte'
  import CreateTheme from './views/CreateTheme.svelte'
  import DuplicateTheme from './views/DuplicateTheme.svelte'
  import EditTheme from './views/EditTheme.svelte'
  // Atlas
  import Atlas from './views/Atlas.svelte'
  import ImportMap from './views/ImportMap.svelte'
  import ExportMap from './views/ExportMap.svelte'
  // About
  import About from './views/About.svelte'

  import SquareButton from './components/SquareButton.svelte'
  import ErrorBell from './components/ErrorBell.svelte'

  import IconRefresh from './icons/refresh.svg'

  let previousView = 'selection'
  let currentView = 'selection'
  let viewData: any = {}

  function changeView(event: CustomEvent) {
    let newView = previousView
    let newData = {}

    if (event.detail && typeof event.detail === 'string') {
      newView = event.detail
    } else if (event.detail) {
      if (event.detail.view) {
        newView = event.detail.view
      }
      if (event.detail.data) {
        newData = event.detail.data
      }
    }
    previousView = currentView
    currentView = newView
    viewData = newData
  }

  $: loadingPercent = ($progressStatus.tasksDone / $progressStatus.totalTasks) * 100.0
  $: loadingMessage = $progressStatus.type == 'change' ? 'Applying styles' : 'Duplicating styles'
  $: {
    updateData($updatedLocalMap)
  }

  let lastUpdated = null
  let updateInterval = null
  let refreshing = false
  let err: AtlasError | null = null

  async function updateData(lastUpdate) {
    if (updateInterval) {
      clearInterval(updateInterval)
      updateInterval = null
    }
    if (lastUpdate === null) {
      lastUpdated = null
    } else {
      const lastDate = new Date(lastUpdate)
      lastUpdated = formatDistance(lastDate, new Date(), { addSuffix: true })
      updateInterval = setInterval(() => {
        lastUpdated = formatDistance(lastDate, new Date(), { addSuffix: true })
      }, 30000)
    }
  }

  function setError(event: CustomEvent) {
    err = event.detail
  }

  async function refreshMap() {
    refreshing = true
    await messenger.sendMessage('refreshMap')
    refreshing = false
  }
</script>

<main>
  {#if currentView == 'selection' || currentView == 'themes' || currentView == 'atlas' || currentView == 'about'}
    <NavigationBar {currentView} on:changeView={changeView} />

    {#if currentView == 'selection'}
      <Selection on:changeView={changeView} on:error={setError} />
    {:else if currentView == 'themes'}
      <Themes on:changeView={changeView} on:error={setError} />
    {:else if currentView == 'atlas'}
      <Atlas on:changeView={changeView} on:error={setError} />
    {:else if currentView == 'about'}
      <About />
    {/if}

    <div class="status-bar">
      {#if !$progressStatus.done}
        <div class="progress">
          <p>{loadingMessage}... ({$progressStatus.tasksDone} of {$progressStatus.totalTasks})</p>
          <div class="bar"><div style="width: {loadingPercent}%;" /></div>
        </div>
      {:else if lastUpdated !== null}
        <p id="lastUpdated" class="sidePadding">Last updated: {lastUpdated}</p>
      {:else}
        <div />
      {/if}
      <SquareButton
        on:click={refreshMap}
        spin={refreshing || !$progressStatus.done}
        disabled={refreshing || !$progressStatus.done || lastUpdated == null}
        iconName={IconRefresh}
      />
    </div>
  {:else if currentView == 'createTheme'}
    <CreateTheme on:changeView={changeView} on:error={setError} />
  {:else if currentView == 'duplicateTheme'}
    <DuplicateTheme on:changeView={changeView} on:error={setError} from={viewData} />
  {:else if currentView == 'editTheme'}
    <EditTheme on:changeView={changeView} on:error={setError} from={viewData} />
  {:else if currentView == 'importMap'}
    <ImportMap on:changeView={changeView} on:error={setError} />
  {:else if currentView == 'exportMap'}
    <ExportMap on:changeView={changeView} on:error={setError} />
  {/if}
</main>

<ErrorBell {err} on:error={setError} />

<style lang="stylus">
  main
    box-sizing border-box
    display flex
    flex-direction column
    height 100%
    width 100%
    background #ffffff

  .status-bar
    display flex
    border-top 1px solid #efefef
    color var(--black4)
    padding var(--size-xxsmall)
    align-items center
    > div, p
      flex-grow 1
    > p
      padding 0
      padding 0 var(--size-xxsmall)
    .progress
      padding 0 var(--size-xxsmall)
      > p
        margin-bottom var(--size-xxxsmall)
      > .bar
        height 4px
        border-radius 4px
        overflow hidden
        width 100%
        background #E3E3E8
        > div
          height 100%
          background-image linear-gradient(90deg, #4E4C62 0%, #8F8CB1 20%, #4E4C62 40%)
          background-color #4E4C62
          background-repeat no-repeat
          animation-duration 1.5s
          animation-iteration-count infninite
          animation-name loadingShimmer
          animation-timing-function linear
          transition width .25s linear

  @keyframes loadingShimmer
    0%
      background-position -30vw 0
    100%
      background-position 70vw 0
</style>
