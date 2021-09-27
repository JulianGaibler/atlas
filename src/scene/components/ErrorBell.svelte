<script lang="ts">
  import type { AtlasError } from '../../errors'
  import { getErrorMessage } from '../../errors'
  import IconClose from '../icons/close.svg'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  function clearError() {
    dispatch('error', null)
  }

  export let err: AtlasError | null
  let message = ''

  $: if (err) {
    message = getErrorMessage(err)
  }
</script>

<div class="dialog-wrapper" class:hidden={err == null}>
  <aside class="errorbox">
    <span>{message}</span>
    <button on:click={clearError}>{@html IconClose}</button>
  </aside>
</div>

<style lang="stylus">
  .dialog-wrapper
    position fixed
    display flex
    width 100%
    bottom var(--size-xsmall)
    z-index 11
    transition bottom .2s
    align-items flex-end
    justify-content center
    transition transform .15s ease-out
    transition-property transform, opacity
    transform translate(0)
    pointer-events none
    &.hidden
      transform translate3d(0,3px,0)
      opacity 0
      > .errorbox
        pointer-events none
    .errorbox
      pointer-events auto
      background var(--red)
      box-shadow 0 5px 17px rgba(0, 0, 0, 0.2), 0 2px 7px rgba(0, 0, 0, 0.15), inset 0 0 0 1px #000, 0 0 0 1px rgba(0, 0, 0, 0.1)
      font-weight 500
      user-select none
      border none
      border-radius 5px
      overflow hidden
      display flex
      align-items center
      max-width 800px
      margin 0 var(--size-xsmall)
      color #fff
      font-size 14px
      line-height 24px
      letter-spacing -.087px
      padding 0
      flex-grow 1
      > span
        padding 5px 16px
        flex-grow 1
      > button
        border none
        background unset
        display flex
        align-items center
        justify-content center
        height 32px
        width 32px
        flex 0 0 32px
        line-height 32px
        border-left 1px solid hsla(0,0%,100%,.2)
        cursor inherit
        padding 2px
        color #fff
        :global(svg path)
          fill #fff
        &:focus
          outline none
        &:focus-visible
          background var(--black8)
        &:hover
          background var(--black)
    &.hidden > .errorbox
      pointer-events none
</style>
