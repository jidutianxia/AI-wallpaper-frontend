import { defineComponent, h } from 'vue'

const passthrough = (tag = 'div') => defineComponent({
  name: `${tag}-stub`,
  setup(_props, { attrs, slots }) {
    return () => h(tag, attrs, [
      slots.default?.(),
      slots.header?.(),
      slots.footer?.(),
      slots.template?.(),
      slots.dropdown?.(),
      slots.prefix?.(),
      slots.suffix?.()
    ])
  }
})

const buttonStub = defineComponent({
  name: 'el-button-stub',
  setup(_props, { attrs, slots }) {
    return () => h('button', { type: 'button', ...attrs }, slots.default?.())
  }
})

const inputStub = defineComponent({
  name: 'el-input-stub',
  props: {
    modelValue: { type: [String, Number], default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    return () => h('label', { class: attrs.class }, [
      slots.prefix?.(),
      h('input', {
        value: props.modelValue,
        placeholder: attrs.placeholder,
        onInput: (event) => emit('update:modelValue', event.target.value),
        onKeyup: attrs.onKeyup,
        onFocus: attrs.onFocus
      }),
      slots.default?.(),
      slots.suffix?.()
    ])
  }
})

const dialogStub = defineComponent({
  name: 'el-dialog-stub',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots }) {
    return () => props.modelValue
      ? h('section', { class: attrs.class || 'el-dialog-stub' }, [
        slots.default?.(),
        slots.footer?.()
      ])
      : null
  }
})

const switchStub = defineComponent({
  name: 'el-switch-stub',
  props: {
    modelValue: { type: Boolean, default: false }
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => h('input', {
      ...attrs,
      type: 'checkbox',
      checked: props.modelValue,
      onChange: (event) => emit('update:modelValue', event.target.checked)
    })
  }
})

const paginationStub = defineComponent({
  name: 'el-pagination-stub',
  props: {
    currentPage: { type: Number, default: 1 }
  },
  emits: ['update:currentPage', 'current-change'],
  setup(_props, { attrs, emit }) {
    return () => h('button', {
      type: 'button',
      class: 'pagination-stub',
      ...attrs,
      onClick: () => {
        emit('update:currentPage', 2)
        emit('current-change', 2)
      }
    }, 'next page')
  }
})

export const elementStubs = {
  ElButton: buttonStub,
  'el-button': buttonStub,
  ElInput: inputStub,
  'el-input': inputStub,
  ElDialog: dialogStub,
  'el-dialog': dialogStub,
  ElSwitch: switchStub,
  'el-switch': switchStub,
  ElPagination: paginationStub,
  'el-pagination': paginationStub,
  ElTabs: passthrough('section'),
  'el-tabs': passthrough('section'),
  ElTabPane: passthrough('section'),
  'el-tab-pane': passthrough('section'),
  ElCard: passthrough('article'),
  'el-card': passthrough('article'),
  ElAvatar: passthrough('span'),
  'el-avatar': passthrough('span'),
  ElCheckbox: passthrough('label'),
  'el-checkbox': passthrough('label'),
  ElIcon: passthrough('span'),
  'el-icon': passthrough('span'),
  ElDrawer: passthrough('aside'),
  'el-drawer': passthrough('aside'),
  ElEmpty: passthrough('div'),
  'el-empty': passthrough('div'),
  ElImage: passthrough('img'),
  'el-image': passthrough('img'),
  ElSkeleton: passthrough('div'),
  'el-skeleton': passthrough('div'),
  ElSkeletonItem: passthrough('div'),
  'el-skeleton-item': passthrough('div'),
  ElProgress: passthrough('div'),
  'el-progress': passthrough('div'),
  ElSelect: passthrough('div'),
  'el-select': passthrough('div'),
  ElOption: passthrough('option'),
  'el-option': passthrough('option'),
  ElRadioGroup: passthrough('div'),
  'el-radio-group': passthrough('div'),
  ElRadioButton: passthrough('button'),
  'el-radio-button': passthrough('button'),
  ElTag: passthrough('span'),
  'el-tag': passthrough('span'),
  ElDropdown: passthrough('div'),
  'el-dropdown': passthrough('div'),
  ElDropdownMenu: passthrough('div'),
  'el-dropdown-menu': passthrough('div'),
  ElDropdownItem: passthrough('button'),
  'el-dropdown-item': passthrough('button'),
  ElUpload: passthrough('div'),
  'el-upload': passthrough('div'),
  ElForm: passthrough('form'),
  'el-form': passthrough('form'),
  ElFormItem: passthrough('div'),
  'el-form-item': passthrough('div')
}

export const routerLinkStub = defineComponent({
  name: 'router-link-stub',
  props: {
    to: { type: [String, Object], required: true }
  },
  setup(props, { slots }) {
    const href = typeof props.to === 'string' ? props.to : props.to.path || ''
    return () => h('a', { href }, slots.default?.())
  }
})

export const mountOptions = (overrides = {}) => {
  const { global = {}, ...rest } = overrides

  return {
    global: {
      ...global,
      stubs: {
        RouterLink: routerLinkStub,
        'router-link': routerLinkStub,
        Transition: false,
        ...elementStubs,
        ...(global.stubs || {})
      },
      directives: {
        clickOutside: {},
        ...(global.directives || {})
      }
    },
    ...rest
  }
}

export const installBrowserMocks = () => {
  if (!window.IntersectionObserver) {
    window.IntersectionObserver = class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
  if (!window.scrollTo) {
    window.scrollTo = () => {}
  }
}
