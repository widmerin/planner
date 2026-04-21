import type { Locator, Page } from '@playwright/test'

export async function dragToWithFallback(
  page: Page,
  source: Locator,
  target: Locator,
) {
  try {
    await source.dragTo(target)
    return
  } catch {
    await dragToViaDataTransfer(page, source, target)
  }
}

async function dragToViaDataTransfer(page: Page, source: Locator, target: Locator) {
  const sourceHandle = await source.elementHandle()
  const targetHandle = await target.elementHandle()

  if (!sourceHandle || !targetHandle) {
    throw new Error('dragToViaDataTransfer: missing source/target element')
  }

  await page.evaluate(
    async ([src, dst]) => {
      const dataTransfer = new DataTransfer()

      const fire = (el: Element, type: string) => {
        const evt = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          dataTransfer,
        })
        el.dispatchEvent(evt)
      }

      fire(src, 'dragstart')
      fire(dst, 'dragenter')
      fire(dst, 'dragover')
      fire(dst, 'drop')
      fire(src, 'dragend')
    },
    [sourceHandle, targetHandle],
  )
}
