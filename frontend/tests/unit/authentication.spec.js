import { shallowMount } from "@vue/test-utils";
import Login from "@/views/Login.vue";

describe("Login.vue", () => {
  const wrapper = shallowMount(Login);
  console.log(wrapper);
});
