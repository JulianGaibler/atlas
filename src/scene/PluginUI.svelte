<script lang="ts">
  import formatDistance from 'date-fns/formatDistance'
  import { messenger } from './store'

  import Selection from './views/Selection.svelte'
  import LocalMap from './views/LocalMap.svelte'
  import Atlas from './views/Atlas.svelte'
  import CreateTheme from './views/CreateTheme.svelte'
  import DuplicateTheme from './views/DuplicateTheme.svelte'
  import EditTheme from './views/EditTheme.svelte'
  import ImportMap from './views/ImportMap.svelte'
  import ExportMap from './views/ExportMap.svelte'

  let currentView = 'main'
  let viewData: any = {}

  function changeView(event: CustomEvent) {
    let newView = 'main'
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

    if (newView === 'main') {
      updateData()
    }
    currentView = newView
    viewData = newData
  }

  let localThemes = []
  let atlas = []
  let lastUpdated = null
  let updateInterval = null

  async function updateData() {
    localThemes = await messenger.sendMessage('getLocalThemes')
    if (localThemes.length > 0) {
      const potentialIsoDate = await messenger.sendMessage('getLastMapUpdate')
      if (updateInterval) {
        clearInterval(updateInterval)
        updateInterval = null
      }
      if (potentialIsoDate === null) {
        lastUpdated = 'Never'
      } else {
        const lastDate = new Date(potentialIsoDate)
        lastUpdated = formatDistance(lastDate, new Date(), { addSuffix: true })
        updateInterval = setInterval(() => {
          lastUpdated = formatDistance(lastDate, new Date(), { addSuffix: true })
        }, 30000)
      }
    } else {
      lastUpdated = null
    }
    atlas = (await messenger.sendMessage('getAtlas')).map((item) => {
      item.lastUpdated = new Date(item.lastUpdatedISO)
      return item
    })
  }

  updateData()
</script>

<style lang="scss">
  :global {
    @import './global.scss';
  }

  div {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background: #ffffff;
    overflow: auto;
    // width: 290px;
    // height: 485px;
    // box-shadow: 0px 0px 0px 0.5px rgba(0, 0, 0, 0.2),
    //   0px 2px 14px rgba(0, 0, 0, 0.15);
    // border-radius: 2px;
  }

  #lastUpdated {
    color: var(--black3);
    padding-top: var(--size-xxxsmall);
    padding-bottom: var(--size-xxsmall);
  }
</style>

<div>
  {#if currentView == 'main'}
    <Selection />
    <hr />
    <LocalMap on:changeView={changeView} themes={localThemes} />
    {#if lastUpdated !== null}
      <p id="lastUpdated" class="sidePadding">Last updated: {lastUpdated}</p>
    {/if}
    <hr />
    <span />
    <Atlas {atlas} showLocal={localThemes.length > 0} on:changeView={changeView} />
  {:else if currentView == 'createTheme'}
    <CreateTheme on:changeView={changeView} />
  {:else if currentView == 'duplicateTheme'}
    <DuplicateTheme on:changeView={changeView} from={viewData} />
  {:else if currentView == 'editTheme'}
    <EditTheme on:changeView={changeView} from={viewData} />
  {:else if currentView == 'importMap'}
    <ImportMap on:changeView={changeView} />
  {:else if currentView == 'exportMap'}
    <ExportMap on:changeView={changeView} />
  {/if}
</div>
