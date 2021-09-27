<script lang="ts">
  import type { Result } from '../../types'
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Button from '../components/Button.svelte'
  import Textarea from '../components/Textarea.svelte'

  import MapIllustration from '../illustrations/map-illustration-import.svg'

  const dispatch = createEventDispatcher()

  async function startImport() {
    const res: Result<any> = await messenger.sendMessage('importMap', {
      json: pastedMap,
    })
    if (res.error) {
      dispatch('error', res.error)
      return
    }
    dispatch('changeView')
  }
  let pastedMap = ''
</script>

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
    <div class="sectionBox flexRow">
      <Button
        on:click={() => {
          dispatch('changeView')
        }}
        variant="secondary"
      >
        Cancel
      </Button>
      <Button disabled={pastedMap.length < 2} on:click={startImport}>Import</Button>
    </div>
  </div>
</section>

<style lang="stylus">
  .thumbnail
    background #013C2A
</style>
