<script lang="ts">
  import { createEventDispatcher, tick } from 'svelte'
  import { messenger } from '../store'
  import type { MappedTheme, Theme } from '../../types'
  import { groupBy, groupObjToArray } from '../../utils'

  import Header from '../components/Header.svelte'
  import SquareButton from '../components/SquareButton.svelte'
  import Button from '../components/Button.svelte'
  import Checkbox from '../components/Checkbox.svelte'

  import IconPlus from '../icons/plus.svg'
  import IconTrash from '../icons/trash.svg'
  import IconCopy from '../icons/copy.svg'
  import IconAdjust from '../icons/adjust.svg'

  interface GroupedByMaps {
    mapName: string
    local: boolean
    groupedThemes: GroupedByGroups[]
  }
  interface GroupedByGroups {
    group: string
    themes: MappedTheme[]
  }

  const dispatch = createEventDispatcher()

  let localTheme: GroupedByGroups[] = []
  let externalThemes: GroupedByMaps[] = []

  async function getThemes() {
    let allThemes: MappedTheme[] = await messenger.sendMessage('getAllThemesByMap')
    let allGroupedThemes = Object.entries(groupBy(allThemes, 'mapId')).map(([, themes]) => {
      let groupedThemes = groupObjToArray(
        themes.reduce((rv, x) => {
          ;(rv[x.group || 'noGroup'] = rv[x.group || 'noGroup'] || []).push(x)
          return rv
        }, {}),
        'group',
        'themes',
      ) as unknown as GroupedByGroups[]

      return {
        mapName: themes[0].mapName,
        local: themes[0].local,
        groupedThemes,
      }
    })

    if (allGroupedThemes[0]?.local) {
      localTheme = allGroupedThemes[0].groupedThemes
      externalThemes = allGroupedThemes.slice(1)
    } else {
      localTheme = []
      externalThemes = allGroupedThemes
    }
  }
  getThemes()

  async function deleteStyle() {
    deleteWorking = true
    await messenger.sendMessage('deleteTheme', {
      themeId: deleteTheme.idName,
      deleteStyles,
    })
    deleteWorking = false
    deleteTheme = null
    deleteStyles = false
    getThemes()
  }

  let deleteTheme: Theme | null = null
  let deleteStyles = false

  let deleteWorking = false
</script>

<section class="scroll-box">
  {#if deleteTheme !== null}
    <Header title="Delete '{deleteTheme.displayName}'" />
    <p class="flexRow sidePadding">
      Deleting a theme in the Atlas plugin does not change anything in your document unless you
      specifically want to delete the styles as well.
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
          }}
        >
          Cancel
        </Button>
        <Button destructive={deleteStyles} disabled={deleteWorking} on:click={deleteStyle}>
          Delete
        </Button>
      </div>
    </div>
  {:else}
    <Header title="Local Themes">
      <SquareButton
        on:click={() => {
          dispatch('changeView', 'createTheme')
        }}
        iconName={IconPlus}
      />
    </Header>

    {#if localTheme.length < 1}
      <div class="nothing">No local themes</div>
    {:else}
      <section>
        {#each localTheme as gThemes}
          {#if gThemes.group != 'noGroup'}<div class="sectionTitle sidePadding">
              {gThemes.group}
            </div>{/if}
          {#each gThemes.themes as theme}
            <div class="singleItem">
              <span class="color" style="background-color: {theme.color}" />
              <span class="label">{theme.displayName}</span>
              <SquareButton
                class="hiddenUntilHover"
                iconName={IconTrash}
                on:click={() => {
                  deleteTheme = theme
                  deleteStyles = false
                }}
              />
              <SquareButton
                class="hiddenUntilHover"
                iconName={IconCopy}
                on:click={() => {
                  dispatch('changeView', { view: 'duplicateTheme', data: theme })
                }}
              />
              <SquareButton
                class="hiddenUntilHover"
                iconName={IconAdjust}
                on:click={() => {
                  dispatch('changeView', { view: 'editTheme', data: theme })
                }}
              />
            </div>
          {/each}
        {/each}
      </section>
    {/if}

    <hr class="spacer" />

    <Header title="External Themes" />

    {#if externalThemes.length < 1}
      <div class="nothing">No external themes</div>
    {:else}
      {#each externalThemes as gMaps}
        <section>
          {#each gMaps.groupedThemes as gThemes}
            <div class="sectionTitle sidePadding">
              {#if gThemes.group != 'noGroup'}<span class="map-name"
                  >{gMaps.mapName} →
                </span>{gThemes.group}{:else}<span class="map-name">{gMaps.mapName}</span>{/if}
            </div>
            {#each gThemes.themes as theme}
              <div class="singleItem">
                <span class="color" style="background-color: {theme.color}" />
                <span class="label">{theme.displayName}</span>
                <SquareButton
                  class="hiddenUntilHover"
                  iconName={IconCopy}
                  on:click={() => {
                    dispatch('changeView', { view: 'duplicateTheme', data: theme })
                  }}
                />
              </div>
            {/each}
          {/each}
        </section>
      {/each}
    {/if}
  {/if}
</section>

<style lang="stylus">
  section
    flex-grow 1
  .map-name
    color var(--black4)
    margin-right 1px
  .spacer
    margin var(--size-xxsmall) 0
  .nothing
    text-align center
    color var(--black4)
    margin var(--size-medium)
</style>
