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

  import MapIllustration from '../illustrations/map-illustration-red.svg'

  const dispatch = createEventDispatcher()

  async function startExport() {
    const res = await messenger.sendMessage('exportMap', {
      name: mapName,
    })

    if (res.success) {
      generatedMap = res.data
    } else if (res.type === 'errNoThemeExported') {
      error = 'No themes were exported, likely because no themed style is published.'
    } else {
      error = 'An unknown error occured :('
    }
    step = 2
  }

  let step = 1
  let error = null
  let mapName = ''
  let generatedMap = ''

  messenger.sendMessage('getDocumentName').then((docname) => {
    console.log(docname)
    if (mapName.length < 1) {
      mapName = docname
    }
  })
</script>

<style lang="stylus">
  .textInfo > :global(*)
    margin-bottom var(--size-xxsmall)

  .thumbnail
    background #E46565
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
          variant="secondary">
          Cancel
        </Button>
        <Button on:click={startExport}>Export</Button>
      </div>
    </div>
  {:else if step == 2 && error}
    <div class="rowBox flexGrow">
      <Info type="error" svgIcon={IconWarning}>{error}</Info>
    </div>
    <div class="rowBox">
      <div class="sectionBox flexRow">
        <Button
          on:click={() => {
            dispatch('changeView')
          }}
          variant="secondary">
          Close
        </Button>
      </div>
    </div>
  {:else}
    <div class="rowBox flexGrow">
      <Textarea
        rows={12}
        readonly={true}
        placeholder="Click export to generate a Map"
        selectOnFocus={true}
        bind:value={generatedMap} />
    </div>
    <div class="rowBox">
      <div class="rowBox">
        <div class="sectionBox flexRow">
          <Button
            on:click={() => {
              dispatch('changeView')
            }}
            variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </div>
  {/if}
</section>
