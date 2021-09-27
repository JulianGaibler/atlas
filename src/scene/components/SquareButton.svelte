<script>
  export let iconName = null //pass svg data into this var by importing an svg in parent
  export let spin = false
  export let disabled = false
  export let color = 'black8'
  export { className as class }

  let className = ''
</script>

<button
  on:click
  on:submit|preventDefault
  class:spin
  {disabled}
  class="icon-component {className}"
  onclick="this.blur()"
  style="color: var(--{color}) fill: var(--{color})"
>
  {@html iconName}
</button>

<style lang="stylus">
  button
    position relative

  .icon-component
    display flex
    align-items center
    justify-content center
    cursor default
    width var(--size-medium)
    height var(--size-medium)
    font-family var(--font-stack)
    font-size var(--font-size-xsmall)
    user-select none
    border-radius var(--border-radius-small)
    background unset
    border 1px solid transparent
    line-height 0
    padding 0
    &:hover
      background-color var(--hover-fill)
    &:focus
      outline none
      border-color var(--blue)
      box-shadow inset 0 0 0 1px var(--blue)
    &:disabled
      opacity 0.5

  .spin > :global(*)
    animation rotating 1s linear infinite


  @keyframes rotating
    from
      transform rotate(360deg)
    to
      transform rotate(0deg)

  :global(.icon-component *)
    position absolute
    fill inherit
    color inherit
</style>
