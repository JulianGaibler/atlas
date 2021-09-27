<script>
  export let svgIcon = null
  export let type = ''

  let className = ''
</script>

<div class="onboarding-tip {type}">
  <div class="icon">
    <div class="icon-component">
      {@html svgIcon}
    </div>
  </div>
  <p>
    <slot />
  </p>
</div>

<style lang="scss">
  .onboarding-tip {
    display: flex;
    align-items: top;
    padding: var(--size-xxsmall) var(--size-xsmall) var(--size-xxsmall) var(--size-xxxsmall);
    background-color: var(--grey);
    border-radius: var(--border-radius-large);
    &.error {
      background-color: var(--light-red);
    }
  }

  .icon {
    width: var(--size-medium);
    height: var(--size-medium);
    margin-right: var(--size-xxxsmall);
    fill: var(--black8);
    flex-shrink: 0;
  }

  p {
    padding: var(--size-xxsmall) 0 var(--size-xxsmall) 0;
    font-size: var(--font-size-xsmall);
    font-weight: var(--font-weight-normal);
    letter-spacing: var(--font-letter-spacing-pos-xsmall);
    line-height: var(--line-height);
    color: var(--black8);
    margin: 0;
  }

  :global(.icon-component *) {
    fill: inherit;
  }
</style>
