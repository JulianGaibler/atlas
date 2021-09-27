<script lang="ts">
  import type { Result, Theme } from '../../types'
  import { ErrorType } from '../../errors'
  import { createEventDispatcher } from 'svelte'
  import parseColorString from '../parseColorString'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'

  import IconWarning from '../icons/warning.svg'
  import IconFolderSmall from '../icons/folder-small.svg'

  const dispatch = createEventDispatcher()

  export let from: Theme

  function getHexColor(string) {
    return parseColorString(string)?.hex
  }

  function correctColorString() {
    themeColor = getHexColor(themeColor) || themeColor
  }

  async function duplicateTheme() {
    const hexColor = getHexColor(themeColor)
    if (!hexColor) {
      dispatch('error', {
        type: ErrorType.InputInvalidColor,
      })
      return
    }

    const res: Result<any> = await messenger.sendMessage('editTheme', {
      from: from.idName,
      name: themeName,
      color: `#${hexColor}`,
      group,
    })

    if (res.error) {
      dispatch('error', res.error)
      return
    }

    dispatch('changeView')
  }

  let themeName = from.displayName
  let themeColor = getHexColor(from.color)
  let group = from.group || ''
  $: buttonDisabled = themeName.length == 0 || themeColor.length == 0
</script>

<div class="thumbnail">
  <p>{from.displayName} / Button / Enabled</p>
  <p>
    <span>{themeName.trim() || from.displayName}</span> / Button / Enabled
  </p>
</div>
<section class="flexSection flexGrow">
  <Header title="Edit '{from.displayName}'" />
  <div class="rowBox flexGrow">
    <Input iconText="Aa" bind:value={themeName} placeholder="Theme Name" />
    <div class="inputWithColor">
      <Input
        iconText="#"
        on:blur={correctColorString}
        bind:value={themeColor}
        placeholder="Theme Color"
      />
      <span class="color" style="background-color: #{getHexColor(themeColor) || 333}" />
    </div>
    <Input iconName={IconFolderSmall} bind:value={group} placeholder="Group (optional)" />
  </div>
  <div class="rowBox">
    <div class="sectionBox flexRow">
      <Button
        on:click={() => {
          dispatch('changeView')
        }}
        variant="secondary"
      >
        Cancel
      </Button>
      <Button on:click={duplicateTheme} disabled={buttonDisabled}>Edit</Button>
    </div>
    <div class="sectionBox">
      <Info svgIcon={IconWarning}>
        If you change the theme name, the styles in your document will get renamed as well.
      </Info>
    </div>
  </div>
</section>

<style lang="stylus">
  .inputWithColor
    display flex
    align-items center
    :global(.input)
      flex-grow 1
      margin-right 1em
</style>
