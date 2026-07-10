import re

from playwright.async_api import TimeoutError


class Extractor:

    async def elements(self, root, selector):
        return await root.locator(selector).all()


    async def text(self, root, selector):

        try:
            return await root.locator(selector).inner_text()

        except Exception:
            return ""


    async def attribute(self, root, selector, attribute):

        try:
            value = await root.locator(selector).get_attribute(attribute)
            return value or ""

        except Exception:
            return ""


    async def extract(self, root, config):

        selector = config.get("css")

        attribute = config.get("attribute")

        locator = root.locator(selector).first


        try:

            if attribute:
                value = await locator.get_attribute(
                    attribute,
                    timeout=1000
                )

            else:
                value = await locator.inner_text(
                    timeout=1000
                )


        except Exception:

            value = ""


        regex = config.get("regex")

        if regex and value:

            match = re.search(
                regex,
                value
            )

            if match:
                value = match.group(1)


        return value