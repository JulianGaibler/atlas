<script lang="ts">
  import { messenger, somethingSelected } from '../store'
  import type { Theme, ThemedNodes } from '../../types'
  import { MIXED_THEME } from '../../types'

  import Header from '../components/Header.svelte'
  import SelectMenu from '../components/SelectMenu/index.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'

  import IconWarning from '../icons/warning.svg'

  let panel = 'nothing'
  $: {
    selectionChanged($somethingSelected)
  }

  function selectionChanged(newValue) {
    hasMixedItems = false
    if (newValue < 1) {
      panel = 'nothing'
    } else if (newValue < 150) {
      startCheck()
    } else {
      panel = 'tooMuch'
    }
  }

  function selectMixedNodes() {
    messenger.sendMessage('selectMixedNodes')
  }

  async function startCheck() {
    hasMixedItems = false
    let selection: ThemedNodes[] = await messenger.sendMessage('categorizeSelection')

    selection = selection.filter((item) => {
      const isMixed = item.theme.idName === MIXED_THEME.idName
      hasMixedItems = hasMixedItems || isMixed
      return !isMixed
    })

    menuItems = (await messenger.sendMessage('getAllThemes')).map((theme: Theme) => ({
      value: theme.idName,
      label: theme.displayName,
      color: theme.color,
      group: null,
      selected: false,
    }))
    let selectedShape = menuItems[0]

    selectedThemes = selection.map((node) => {
      const i = menuItems.findIndex((item) => item.value === node.theme.idName)
      return {
        ...node.theme,
        value: menuItems[i],
      }
    })

    panel = 'results'
  }

  async function changeTheme(theme, value) {
    await messenger.sendMessage('changeTheme', {
      from: theme.idName,
      to: value.detail.value,
    })

    await startCheck()
  }

  let selectedThemes = []
  let menuItems = []
  let hasMixedItems = false
</script>

<style lang="stylus">
  section
    min-height 92px
  .nothing
    text-align center
    color var(--black4)
    margin-top 14px
  p
    margin 2px 2px 2px 0px
  #mixedWarning
    h1
      margin -2px 0 0
      font-size var(--font-size-xlarge)
    p
      margin 4px 0 2px 0
    :global(button)
      height auto
      margin 0 0 -2px 0
</style>

<section>
  <Header title="Selection" />
  {#if panel === 'results'}
    {#if hasMixedItems}
      <div id="mixedWarning" class="sectionBox rowBox">
        <Info type="error" svgIcon={IconWarning}>
          <h1>Mixed Nodes!</h1>
          <p>Styles cannot be changed if one node has multiple styles applied to it.</p>
          <Button variant="tertiary" destructive={true} on:click={selectMixedNodes}>
            select mixed nodes →
          </Button>
        </Info>
      </div>
    {/if}
    {#each selectedThemes as theme (theme.idName)}
      <SelectMenu
        class="rowBox"
        value={theme.value}
        on:change={(val) => changeTheme(theme, val)}
        bind:menuItems />
    {/each}
  {:else if panel === 'nothing'}
    <p class="nothing">Nothing selected</p>
  {:else}
    <div class="flexRow sidePadding">
      <div class="flexGrow">
        <p>You selected a lot of items</p>
        <p>Check selection you're ready!</p>
      </div>
      <Button on:click={startCheck} disabled={!$somethingSelected} variant="secondary">
        Check
      </Button>
    </div>
  {/if}
</section>
