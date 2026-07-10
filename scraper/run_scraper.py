import asyncio

from paseo.scraper.generic_scraper import GenericScraper


async def main():

    scraper = GenericScraper(
        "airbnb"
    )

    results = await scraper.search(
        "Medellin"
    )

    scraper.save(
        results,
        "data/raw/airbnb_medellin.csv"
    )

    await scraper.close()


if __name__ == "__main__":
    asyncio.run(main())