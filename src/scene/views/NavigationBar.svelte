<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import WelsIcon from '../icons/wels-nav.svg'

  const dispatch = createEventDispatcher()

  export let currentView = ''

  // dispatch('changeView')
</script>

<nav>
  <ol>
    <li>
      <button
        class:selected={currentView === 'selection'}
        on:click={() => {
          dispatch('changeView', 'selection')
        }}>Selection</button
      >
    </li>
    <li>
      <button
        class:selected={currentView === 'themes'}
        on:click={() => {
          dispatch('changeView', 'themes')
        }}>Themes</button
      >
    </li>
    <li>
      <button
        class:selected={currentView === 'atlas'}
        on:click={() => {
          dispatch('changeView', 'atlas')
        }}>Atlas</button
      >
    </li>
    <li>
      <button
        class:selected={currentView === 'about'}
        on:click={() => {
          dispatch('changeView', 'about')
        }}>{@html WelsIcon}</button
      >
    </li>
  </ol>
</nav>

<style lang="stylus">
  nav
    border-bottom 1px solid #efefef

    ol
      display flex
      list-style-type none
      padding 0 0px 0 8px
      margin 0
      height 40px
      background #04FFB4
      align-items stretch
      font-weight var(--font-weight-medium)
      li
        padding 0
        button
          border none
          height 100%
          background none
          padding 0 8px
          opacity .5
          &.selected, &:hover, &:focus
            outline none
            opacity 1
          &.selected
            font-weight var(--font-weight-bold)
        &:last-child
          margin-left auto
</style>
