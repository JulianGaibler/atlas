<script lang="ts">
  import type { Result } from '../../types'
  import { createEventDispatcher } from 'svelte'
  import { messenger } from '../store'

  import Header from '../components/Header.svelte'
  import Input from '../components/Input.svelte'
  import Button from '../components/Button.svelte'
  import Textarea from '../components/Textarea.svelte'

  import MapIllustration from '../illustrations/map-illustration-export.svg'

  const dispatch = createEventDispatcher()

  async function startExport() {
    const res: Result<any> = await messenger.sendMessage('exportMap', {
      name: mapName,
    })

    if (res.error) {
      dispatch('error', res.error)
      return
    }
    step = 2
    generatedMap = res.data
  }

  let step = 1
  let mapName = ''
  let generatedMap = ''

  messenger.sendMessage('getDocumentName').then((docname) => {
    if (mapName.length < 1) {
      mapName = docname
    }
  })
</script>

<div class="thumbnail">
  {@html MapIllustration}
</div>
<section class="flexSection flexGrow">
  <Header title="Export Local Map ({step}/2)" />
  {#if step == 1}
    <div class="rowBox flexGrow textInfo">
      <p class="flexRow smallSidePadding">
        Exports all local styles that are associated with a theme and have been published to the
        team library into a map.
      </p>
      <p class="flexRow smallSidePadding">
        Maps can be importet to other files, so you can use themes from your team libraries.
      </p>
      <Input iconText="Aa" bind:value={mapName} placeholder="Map Name" />
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
        <Button on:click={startExport}>Export</Button>
      </div>
    </div>
  {:else}
    <div class="rowBox flexGrow">
      <Textarea
        rows={12}
        readonly={true}
        placeholder="Click export to generate a Map"
        selectOnFocus={true}
        bind:value={generatedMap}
      />
    </div>
    <div class="rowBox">
      <div class="rowBox">
        <div class="sectionBox flexRow">
          <Button
            on:click={() => {
              dispatch('changeView')
            }}
            variant="secondary"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  {/if}
</section>

<style lang="stylus">
  .textInfo > :global(*)
    margin-bottom var(--size-xxsmall)

  .thumbnail
    background #29FFB3
</style>
