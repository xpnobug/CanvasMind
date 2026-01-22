<template>
  <div tabindex="0" role="menuitem" class="lv-menu-item lv-menu-item-size-default" :id="id">
    <div class="icon-container-XAovJs" style="--menu-icon-size:48px">
      <div :class="containerClass">
        <div class="content-XAjJup">
          <div class="icon-menu-m2Y0RB">
            <div class="icon-wrap-tBuhBU hide-itzP3D sf-hidden">
              <slot name="icon-filled"></slot>
            </div>
            <div class="icon-wrap-tBuhBU">
              <slot name="icon"></slot>
            </div>
          </div>
          <div class="lv-typography text-HLQFZY">{{ label }}</div>
        </div>
        <span v-if="hasBadge" class="badge-wrapper-lDD3pn"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  id: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  containerClass: {
    type: String,
    default: 'container-juKD6_'
  },
  hasBadge: {
    type: Boolean,
    default: false
  }
})
</script>
