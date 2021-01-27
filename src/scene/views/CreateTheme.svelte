<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { Theme } from '../../types'
  import parseColorString from '../parseColorString'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'

  import IconSmiley from '../icons/smiley.svg'
  import IconWarning from '../icons/warning.svg'

  const dispatch = createEventDispatcher()

  function getHexColor(string) {
    return parseColorString(string)?.hex
  }

  function correctColorString() {
    themeColor = getHexColor(themeColor) || themeColor
  }

  async function createTheme() {
    error = null

    const hexColor = getHexColor(themeColor)
    if (!hexColor) {
      error = 'Invalid color value'
      return
    }

    const res = await messenger.sendMessage('createTheme', {
      name: themeName,
      color: `#${hexColor}`,
    })

    if (res.success) {
      dispatch('changeView')
    } else if (res.type === 'duplicateTheme') {
      error = 'A theme with this name already exists!'
    } else if (res.type === 'includesForwardSlash') {
      error = "Theme name can't contain a forward slash (/)!"
    } else {
      error = 'An unknown error occured :('
    }
  }

  let error = null

  let themeName = 'Dark'
  let themeColor = '3A3A3A'
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
    align-items: center;
    color: #CCCCCC;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow hidden
    padding-left 20%
    white-space: nowrap
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
  <Header title="Register Local Theme" />
  <div class="thumbnail">
    <p><span>{themeName.trim() || 'Theme'}</span> / Button / Enabled</p>
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
      <Button on:click={createTheme} disabled={buttonDisabled}>Create</Button>
    </div>
    {#if error}
      <div class="sectionBox">
        <Info type="error" svgIcon={IconWarning}>{error}</Info>
      </div>
    {/if}
    <div class="sectionBox">
      <Info svgIcon={IconSmiley}>
        Registering a theme does not create any styles, it just tells Temoj to search for styles
        with that name.
      </Info>
    </div>
  </div>
</section>
