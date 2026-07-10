import pandas as pd

from playwright.async_api import async_playwright

from paseo.scraper.config_loader import load_site_config
from paseo.scraper.extractor import Extractor
from pathlib import Path


class GenericScraper:

    def __init__(self, site_name):

        self.site = load_site_config(site_name)

        self.playwright = None
        self.browser = None
        self.page = None

        self.extractor = Extractor()


    async def open(self):

        self.playwright = await async_playwright().start()

        self.browser = await self.playwright.chromium.launch(
            headless=False
        )

        self.page = await self.browser.new_page(
            viewport={
                "width": 1600,
                "height": 1000,
            }
        )


    async def close(self):

        if self.browser:
            await self.browser.close()

        if self.playwright:
            await self.playwright.stop()


    async def search(self, city):

        if self.page is None:
            await self.open()

        url = self.site["search_url"].format(
            city=city
        )

        print(f"\nOpening:\n{url}\n")

        await self.page.goto(
            url,
            wait_until="domcontentloaded",
            timeout=120000
        )

        #
        # Optional:
        # allow Airbnb JS to finish rendering
        #
        await self.page.wait_for_timeout(5000)

        cards = await self.extractor.elements(
            self.page,
            self.site["listing"]["css"]
        )

        print(f"Found {len(cards)} listings")

        listings = []

        for card in cards:

            listing = {}

            for field, config in self.site["fields"].items():

                listing[field] = await self.extractor.extract(
                    card,
                    config
                )

            listings.append(listing)
            # print('listing: ', listing)
        return listings


    from pathlib import Path


    def save(self, listings, filename):

        df = pd.DataFrame(listings)

        project_root = Path(__file__).resolve().parents[1]

        output_path = project_root / filename

        output_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        df.to_csv(
            output_path,
            index=False
        )

        print(
            f"Saved {len(df)} listings -> {output_path}"
        )