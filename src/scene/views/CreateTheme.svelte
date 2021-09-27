<script lang="ts">
  import type { Result } from '../../types'
  import { ErrorType } from '../../errors'
  import { createEventDispatcher } from 'svelte'
  import parseColorString from '../parseColorString'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'

  import IconSmiley from '../icons/smiley.svg'
  import IconFolderSmall from '../icons/folder-small.svg'

  const dispatch = createEventDispatcher()

  function getHexColor(string) {
    return parseColorString(string)?.hex
  }

  function correctColorString() {
    themeColor = getHexColor(themeColor) || themeColor
  }

  async function createTheme() {
    const hexColor = getHexColor(themeColor)
    if (!hexColor) {
      dispatch('error', {
        type: ErrorType.InputInvalidColor,
      })
      return
    }

    const res: Result<any> = await messenger.sendMessage('createTheme', {
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

  let themeName = 'Dark'
  let themeColor = '3A3A3A'
  let group = ''
  $: buttonDisabled = themeName.length == 0 || themeColor.length == 0
</script>

<div class="thumbnail">
  <p><span>{themeName.trim() || 'Theme'}</span> / Button / Enabled</p>
</div>
<section class="flexSection flexGrow">
  <Header title="Register Local Theme" />
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
      <Button on:click={createTheme} disabled={buttonDisabled}>Create</Button>
    </div>
    <div class="sectionBox">
      <Info svgIcon={IconSmiley}>
        Registering a theme does not create any styles, it just tells the Atlas Plugin to search for
        styles starting with the given theme name with that name.
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
