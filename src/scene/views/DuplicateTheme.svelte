<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Theme } from '../../types'
  import parseColorString from '../parseColorString'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Checkbox from '../components/Checkbox.svelte'
  import Info from '../components/Info.svelte'

  import IconWarning from '../icons/warning.svg'

  const dispatch = createEventDispatcher()

  export let from: Theme

  function getHexColor(string) {
    return parseColorString(string)?.hex
  }

  function correctColorString() {
    themeColor = getHexColor(themeColor) || themeColor
  }

  async function duplicateTheme() {
    error = null

    const hexColor = getHexColor(themeColor)
    if (!hexColor) {
      error = 'Invalid color value'
      return
    }

    const res = await messenger.sendMessage('duplicateTheme', {
      from: from.idName,
      name: themeName,
      color: `#${hexColor}`,
      addWhitespace,
    })

    if (res.success) {
      dispatch('changeView')
    } else if (res.type === 'errDuplicateTheme') {
      error = 'A theme with this name already exists!'
    } else if (res.type === 'errIncludesForwardSlash') {
      error = "Theme name can't contain a forward slash (/)!"
    } else {
      error = 'An unknown error occured :('
    }
  }

  let error = null

  let themeName = `${from.displayName} 2`
  let themeColor = getHexColor(from.color)
  let addWhitespace = true
  $: buttonDisabled = themeName.length == 0 || themeColor.length == 0
</script>

<style lang="stylus">
  .thumbnail
    height 10rem
    display flex
    align-items center
    font-weight: 600;
    font-size: 24px;
    line-height: 29px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    color: #CCCCCC;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow hidden
    padding-left 20%
    white-space: nowrap
    p
      margin 0
    span
      color var(--black8)

  .inputWithColor
    display flex
    align-items center
    :global(.input)
      flex-grow 1
      margin-right 1em
</style>

<section class="flexSection flexGrow">
  <Header title="Duplicate '{from.displayName}'" />
  <div class="thumbnail">
    <p><span>{from.displayName}</span> / Button / Enabled</p>
    <p>
      <span>{themeName.trim() || 'New Theme'}{addWhitespace ? ' ' : ''}</span>/ Button / Enabled
    </p>
  </div>
  <div class="rowBox flexGrow">
    <Input iconText="Aa" bind:value={themeName} placeholder="Theme Name" />
    <div class="inputWithColor">
      <Input
        iconText="#"
        on:blur={correctColorString}
        bind:value={themeColor}
        placeholder="Theme Color" />
      <span class="color" style="background-color: #{getHexColor(themeColor) || 333}" />
    </div>
    <Checkbox bind:checked={addWhitespace}>Add whitespace between name and slash</Checkbox>
  </div>
  <div class="rowBox">
    <div class="sectionBox flexRow">
      <Button
        on:click={() => {
          dispatch('changeView')
        }}
        variant="secondary">
        Cancel
      </Button>
      <Button on:click={duplicateTheme} disabled={buttonDisabled}>Duplicate</Button>
    </div>
    {#if error}
      <div class="sectionBox">
        <Info type="error" svgIcon={IconWarning}>{error}</Info>
      </div>
    {/if}
    <div class="sectionBox">
      <Info svgIcon={IconWarning}>
        Duplicating a theme, copies all styles associated with it and changes the names accordingly.
      </Info>
    </div>
  </div>
</section>
