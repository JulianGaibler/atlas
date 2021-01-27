<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'
  import type { Theme } from '../../types'

  import Header from '../components/Header.svelte'
  import SquareButton from '../components/SquareButton.svelte'
  import Button from '../components/Button.svelte'
  import Checkbox from '../components/Checkbox.svelte'
  import SelectMenu from '../components/SelectMenu/index.svelte'

  import IconPlus from '../icons/plus.svg'
  import IconRefresh from '../icons/refresh.svg'
  import IconTrash from '../icons/trash.svg'
  import IconCopy from '../icons/copy.svg'
  import IconAdjust from '../icons/adjust.svg'

  const dispatch = createEventDispatcher()
  export let themes = []

  async function refreshMap() {
    refreshing = true
    await messenger.sendMessage('refreshMap')
    refreshing = false
    dispatch('changeView')
  }

  async function deleteStyle() {
    deleteWorking = true
    await messenger.sendMessage('deleteTheme', {
      themeId: deleteTheme.idName,
      deleteStyles,
    })
    // Workaround to trigger UI update
    dispatch('changeView')
    deleteWorking = false
    deleteTheme = null
    deleteStyles = false
  }

  let deleteTheme: Theme | null = null
  let deleteStyles = false

  let deleteWorking = false
  let refreshing = false
</script>

<section>
  {#if deleteTheme !== null}
    <Header title="Delete '{deleteTheme.displayName}'" />
    <p class="flexRow sidePadding">
      Deleting a theme in Temoji does not change anything in your document unless you specifically
      want to delete the styles as well.
    </p>
    <div class="rowBox">
      <Checkbox bind:checked={deleteStyles}>Also delete styles in this document</Checkbox>
      <div class="sectionBox flexRow">
        <Button
          variant="secondary"
          disabled={deleteWorking}
          on:click={() => {
            deleteTheme = null
            deleteStyles = false
          }}>
          Cancel
        </Button>
        <Button destructive={deleteStyles} disabled={deleteWorking} on:click={deleteStyle}>
          Delete
        </Button>
      </div>
    </div>
  {:else}
    <Header title="Local Theme Map">
      {#if themes.length > 0}
        <SquareButton
          on:click={refreshMap}
          spin={refreshing}
          disabled={refreshing}
          iconName={IconRefresh} />
      {/if}
      <SquareButton
        on:click={() => {
          dispatch('changeView', 'createTheme')
        }}
        iconName={IconPlus} />
    </Header>
    {#each themes as theme}
      <div class="singleItem">
        <span class="color" style="background-color: {theme.color}" />
        <span class="label">{theme.displayName}</span>
        <SquareButton
          class="hiddenUntilHover"
          iconName={IconTrash}
          on:click={() => {
            deleteTheme = theme
            deleteStyles = false
          }} />
        <SquareButton
          class="hiddenUntilHover"
          iconName={IconCopy}
          on:click={() => {
            dispatch('changeView', { view: 'duplicateTheme', data: theme })
          }} />
        <SquareButton
          class="hiddenUntilHover"
          iconName={IconAdjust}
          on:click={() => {
            dispatch('changeView', { view: 'editTheme', data: theme })
          }} />
      </div>
    {/each}
  {/if}
</section>
