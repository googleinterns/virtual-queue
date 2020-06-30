import { searchMount } from '@vue/test-utils'
import Search from '../src/views/Search.vue'

describe('Search.vue', () => {
  test("testcase#1", () => {
    const wrapper = searchMount(Search);
    expect(wrapper.isVueInstance()).toBeTruthy();
  });
    // Now mount the component and you have the wrapper
    // const wrapper = mount(Search)
    // console.log(wrapper)
    // // checks the raw component data 
    // it('sets the correct default data', () => {
    //     expect(typeof Search.data).toBe('function')
    //     const defaultData = Search.data()
    //     expect(defaultData.markers).toBe([])
    // })

    // checks the error message on location off
    // it('checks the error message on location off', () => {
    //     wrapper.setData({ locationOn: false })
    //     expect(wrapper.html()).toContain('<h1 class="subtitle is-6 error-sign width-80" v-if="locationOn == false">'+maps_api.getLocationDisabledError()+'</h1>')
    // })

    // it('renders the correct markup', () => {
    //   expect(wrapper.html()).toContain('<span class="count">0</span>')
    // })
  
    // // it's also easy to check for the existence of elements
    // it('has a button', () => {
    //   expect(wrapper.contains('button')).toBe(true)
    // })
  })