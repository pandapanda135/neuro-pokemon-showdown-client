import requests
import os
from urllib.parse import urlparse
from bs4 import BeautifulSoup

def download_file(url, local_filename):
	try:
		if os.path.exists(f"{local_filename}"):
			print(f"Did not install {url} as it already exists")
			return None

		with requests.get(url, stream=True, timeout=30) as response:
			response.raise_for_status()

			with open(local_filename, "wb") as file:
				for chunk in response.iter_content(chunk_size=8192):
					file.write(chunk)

		print(f"Downloaded: {local_filename}")
		return local_filename

	except requests.exceptions.RequestException as e:
		print(f"Download failed: {e}")
		return None

# return string array
def get_all_files(base_url):
	links = []

	request = requests.get(base_url)

	page = BeautifulSoup(request.content,"html.parser")

	a_tag = page.find(class_="dirlist")

	if not a_tag:
		print("no list")
		return []

	for tag in a_tag.find_all('a'):
		print("new tag:")
		print(tag["href"])
		links.append(tag["href"])

	return links

audio_links = ["audio/","cries/", "src/"]
full_link_string = ""

for link in audio_links:
	full_link_string += link
	folder = f"play.pokemonshowdown.com/{full_link_string[0:len(full_link_string) - 1]}" # remove end /

	#create dir if does not exist
	if (not os.path.exists(folder)):
		os.mkdir(f"{os.getcwd()}/{folder}")

	for value in get_all_files(f"https://play.pokemonshowdown.com/{full_link_string}"):
		if "?" in value or "src" in value or "cries" in value: # don't include other folders and files
			continue

		value = value.strip()
		value = value[1:]
		print(f"value: {value}  folder: {folder}  full link: {full_link_string}")

		file_url = f"https://play.pokemonshowdown.com/{full_link_string}"
		download_file(file_url, f"{folder}{value}")