export default {
  async scheduled(controller) {
    console.log('cron fired:', controller.cron, new Date(controller.scheduledTime).toISOString())
  },
} satisfies ExportedHandler<Env>
