<script lang="ts">
  import { ErrorType } from '../../errors'
  import type { Result, MappedTheme } from '../../types'
  import { createEventDispatcher } from 'svelte'
  import parseColorString from '../parseColorString'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Checkbox from '../components/Checkbox.svelte'

  import IconFolderSmall from '../icons/folder-small.svg'

  const dispatch = createEventDispatcher()

  export let from: MappedTheme

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

    const res: Result<any> = await messenger.sendMessage('duplicateTheme', {
      from: { mapId: from.mapId, themeId: from.idName },
      name: themeName,
      color: `#${hexColor}`,
      group,
      duplicateStyles,
    })

    if (res.error) {
      dispatch('error', res.error)
      return
    }

    dispatch('changeView')
  }

  let themeName = `${from.displayName} 2`
  let themeColor = getHexColor(from.color)
  let group = from.group || ''
  let duplicateStyles = true
  $: buttonDisabled = themeName.length == 0 || themeColor.length == 0
</script>

<div class="thumbnail">
  <p><span>{from.displayName}</span> / Button / Enabled</p>
  <p>
    <span>{themeName.trim() || 'New Theme'}</span> / Button / Enabled
  </p>
</div>
<section class="flexSection flexGrow">
  <Header title="Duplicate '{from.displayName}'" />
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
    <Checkbox bind:checked={duplicateStyles}>Also duplicate styles in this document</Checkbox>
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
      <Button on:click={duplicateTheme} disabled={buttonDisabled}>Duplicate</Button>
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
