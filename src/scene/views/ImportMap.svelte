<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Info from '../components/Info.svelte'
  import Textarea from '../components/Textarea.svelte'

  import IconSmiley from '../icons/smiley.svg'
  import IconWarning from '../icons/warning.svg'
  import MapIllustration from '../illustrations/map-illustration-blue.svg'

  const dispatch = createEventDispatcher()

  async function startImport() {
    const res = await messenger.sendMessage('importMap', {
      json: pastedMap,
    })

    if (res.success) {
      dispatch('changeView')
    } else if (res.type === 'errNotAnObject') {
      error = 'Could not parse data. (not an object)'
    } else if (res.type === 'errMissingValue') {
      error = 'Could not parse data. (value missing)'
    } else if (res.type === 'errJsonParse') {
      error = 'Could not parse data. (JSON error)'
    } else if (res.type === 'errThemeNameCollision') {
      error = `Your atlas already contains the theme '${res.data}'`
    } else {
      error = 'An unknown error occured :('
    }
  }

  let error = ''
  let pastedMap = ''
</script>

<style lang="stylus">
  .textInfo > :global(*)
    margin-bottom var(--size-xxsmall)

  .thumbnail
    background #659FE4
    height 165px
    overflow hidden
    display flex
    justify-content center
    align-items center
</style>

<div class="thumbnail">
  {@html MapIllustration}
</div>
<section class="flexSection flexGrow">
  <Header title="Import Map" />

  <div class="rowBox flexSection flexGrow">
    <p class="sectionBox flexRow smallSidePadding">
      Import maps generated from other documents to use team styles
    </p>
    <Textarea rows={6} placeholder="Paste an exported map here" bind:value={pastedMap} />
  </div>
  <div class="rowBox flexSection">
    {#if error}
      <div class="sectionBox">
        <Info type="error" svgIcon={IconWarning}>{error}</Info>
      </div>
    {/if}
    <div class="sectionBox flexRow">
      <Button
        on:click={() => {
          dispatch('changeView')
        }}
        variant="secondary">
        Cancel
      </Button>
      <Button disabled={pastedMap.length < 2} on:click={startImport}>Import</Button>
    </div>
  </div>
</section>
