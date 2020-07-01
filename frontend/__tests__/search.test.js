import { searchMount } from '@vue/test-utils'
import search from '../src/search.js'

describe('#sortStoresArray', () => {
  test("Passing test for already sorted array with same integer values of wait & travel time", () => {
    const input = [
      { waitTime: 8, travelTime: 8 },
      { waitTime: 16, travelTime: 16 },
      { waitTime: 24, travelTime: 24 },
      { waitTime: 42, travelTime: 42 },
    ]
    expect(search.sortStoresArray(input)).toEqual(input);
  });

  test("Failing test for unsorted array with same integer values of wait & travel time", () => {
    const input = [
      { waitTime: 16, travelTime: 16 },
      { waitTime: 24, travelTime: 24 },
      { waitTime: 42, travelTime: 42 },
      { waitTime: 8, travelTime: 8 },
    ]
    expect(search.sortStoresArray(input)).not.toBe(input);
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