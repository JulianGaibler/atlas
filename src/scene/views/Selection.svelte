<script lang="ts">
  import { messenger, somethingSelected } from '../store'
  import { createEventDispatcher } from 'svelte'
  import type { MappedTheme, Theme, ThemedNodes } from '../../types'
  import { MIXED_THEME } from '../../types'
  import { groupBy } from '../../utils'

  import SelectMenu from '../components/SelectMenu/index.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'

  import IconWarning from '../icons/warning.svg'
  import IconWels from '../icons/wels-text.svg'
  import IllustrationSelNone from '../illustrations/selection-none.svg'
  import IllustrationSelNoTheme from '../illustrations/selection-notheme.svg'

  interface SelectedTheme {
    value: any
    theme: Theme
  }
  interface SelectedGroup {
    group: string
    themes: SelectedTheme[]
  }

  const dispatch = createEventDispatcher()

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

  let anyThemesInstalled = true
  messenger.sendMessage('anyThemesAdded').then((res) => {
    anyThemesInstalled = res
  })

  function selectMixedNodes() {
    messenger.sendMessage('selectMixedNodes')
  }

  async function updateMenuItems() {
    const themes: MappedTheme[] = await messenger.sendMessage('getAllThemesByMap')

    let groupedThemes = groupBy(themes, 'group')

    menuItems = groupBy(
      (await messenger.sendMessage('getAllThemesByMap')).map((theme: MappedTheme) => ({
        value: theme.idName,
        label: theme.displayName,
        color: theme.color,
        group: theme.mapName,
        atlasGroup: theme.group || 'noGroup',
        atlasMap: theme.mapId,
      })),
      'atlasGroup',
    )
  }

  async function startCheck() {
    await updateMenuItems()

    hasMixedItems = false
    let selection: ThemedNodes[] = (await messenger.sendMessage('categorizeSelection')).data

    selection = selection.filter((item) => {
      const isMixed = item.theme.idName === MIXED_THEME.idName
      hasMixedItems = hasMixedItems || isMixed
      return !isMixed
    })

    let groupedSelection = groupBy(
      selection.map((node) => ({ ...node.theme, group: node.theme.group || 'noGroup' })),
      'group',
    )

    selectedGroups = Object.entries(groupedSelection).map(([group, themes]) => {
      let allThemes = themes.map((theme) => {
        const i = menuItems[group || 'noGroup'].findIndex((item) => item.value === theme.idName)
        return {
          theme,
          value: menuItems[group][i],
        } as SelectedTheme
      })
      return {
        group,
        themes: allThemes,
      } as SelectedGroup
    })
    panel = 'results'
  }

  async function changeTheme(sTheme, value) {
    await messenger.sendMessage('changeTheme', {
      from: {
        mapId: sTheme.value.atlasMap,
        themeId: sTheme.theme.idName,
      },
      to: {
        mapId: value.detail.atlasMap,
        themeId: value.detail.value,
      },
    })

    await startCheck()
  }

  let sectionElement
  let selectedGroups: SelectedGroup[] = []
  let menuItems = {}
  let hasMixedItems = false
</script>

<section class="scroll-box" bind:this={sectionElement}>
  {#if !anyThemesInstalled}
    <div class="welcome">
      <h1>Hi</h1>
      <p>You haven't added any themes yet.</p>
      <p>
        Go to <button
          on:click={() => {
            dispatch('changeView', 'themes')
          }}>Themes</button
        >
        to add themes local to this file or go to
        <button
          on:click={() => {
            dispatch('changeView', 'atlas')
          }}>Atlas</button
        > if you want to import style-maps from another file
      </p>
      <p class="grow">
        Want to learn how Atlas works first? Check out short tutorial videos here by going to the <button
          on:click={() => {
            dispatch('changeView', 'about')
          }}>{@html IconWels} About</button
        > tab.
      </p>
      <p class="secondary">
        Click on the reload-button when you change styles outside of the plugin.
      </p>
    </div>
  {:else if panel === 'results'}
    {#if selectedGroups.length < 1}
      <div class="nothing">
        {@html IllustrationSelNoTheme}
        <p>No themeable items selected</p>
      </div>
    {:else}
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
      {#each selectedGroups as sGroup}
        {#if sGroup.group != 'noGroup'}<div class="sectionTitle sidePadding">
            {sGroup.group}
          </div>{/if}
        {#each sGroup.themes as sTheme}
          <SelectMenu
            class="rowBox"
            value={sTheme.value}
            showGroupLabels={true}
            parent={sectionElement}
            on:change={(val) => changeTheme(sTheme, val)}
            bind:menuItems={menuItems[sGroup.group]}
          />
        {/each}
      {/each}
    {/if}
  {:else if panel === 'nothing'}
    <div class="nothing">
      {@html IllustrationSelNone}
      <p>Nothing selected</p>
    </div>
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

<style lang="stylus">
  section
    min-height 92px
    flex-grow 1
    display flex
    flex-direction column
  .nothing
    text-align center
    margin-top var(--size-medium)
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

  .welcome
    flex-grow 1
    margin var(--size-medium)
    margin-bottom 0
    display flex
    flex-direction column
    p
      margin-bottom var(--size-xxsmall)
      line-height 16px
      &.grow
        flex-grow 1
      &.secondary
        color var(--black4-opaque)
    button
      display inline
      border none
      margin 0
      padding 0
      background unset
      color var(--neon-7)
      :global(svg)
        fill var(--neon-7)

</style>
