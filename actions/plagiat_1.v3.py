# версия полной проверки с проверкой русской орфографии

import os
from difflib import SequenceMatcher
from tqdm import tqdm
import datetime
import requests

# download stopwords corpus, you need to run it once
import nltk
#nltk.download("stopwords")
from nltk.corpus import stopwords
import pymorphy2
from string import punctuation


# ------------------------------- НАСТРОЙКИ ------------
# директория файла (на уровень выше, для структуры репозиториев 2 сем. 2022-23)
BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
# проверяемая директория
LECTION_DIR = os.path.join("EASvZI", "Лекции")

# ссылка для проверки
url = "http://213.155.192.79:3001/u24-28zhevlakov/EASvZI/src/7f39c5f1c632b00ae9fb19bf1b4e87d1604ec73e/%d0%9b%d0%b5%d0%ba%d1%86%d0%b8%d0%b8/1.1.500_%d0%a2%d1%80%d0%b5%d0%b1%d0%be%d0%b2%d0%b0%d0%bd%d0%b8%d1%8f_%d0%90%d0%98%d0%a1/%d0%b6%d0%b5%d0%b2%d0%bb%d0%b0%d0%ba%d0%be%d0%b2.md"

# ------------------------------- / НАСТРОЙКИ ------------


url = url.replace("src", "raw")










#Create lemmatizer and stopwords list
morph = pymorphy2.MorphAnalyzer()
russian_stopwords = stopwords.words("russian")

#Preprocess function
def preprocess_text(text):
    translator = str.maketrans(punctuation, ' '*len(punctuation))
    words = text.translate(translator)
    words = words.lower().split()
    
    # очистка от прилегающего к слову мусора (слово, "или так")
    clear_words = []
    for word in words:
        clear_word = ""
        for s in word:
            if not s in punctuation:
                clear_word = clear_word + s
        clear_words.append(clear_word)
    tokens = []
    tokens = [morph.parse(token)[0].normal_form for token in clear_words if token not in russian_stopwords\
            and token != " " \
            and token.strip() not in punctuation \
            ]

    text = " ".join(tokens)    
    return tokens, text



#Preprocess function
import language_tool_python
tool = language_tool_python.LanguageTool('ru-RU')
def orfo_text(tokens):
    bad_tokens_n = 0
    for token in tokens:
        matches = tool.check(token)
        if len(matches)>0:
            bad_tokens_n += 1
            #print(matches[0].ruleId)

    return bad_tokens_n
    
print()

now = datetime.datetime.now().strftime('%d-%m-%Y %H:%M')
out_str = f"Время проверки: {now} \n"
# print(out_str)

response = requests.get(url)
post_html = response.text

post_list = post_html.split("\n")

# проверяем правильность оформления 1й строки
header_exist = True
line_1 = post_list[0].strip()
line_1 = line_1.replace(chr(65279), "")
if (line_1[0:2]) != "# ":
    print(f"Заголовок статьи не найден: '{line_1[0:1]} {line_1[1:2]}' вместо '# '")
    print(f"{ord(line_1[0:1])} {ord(line_1[1:2])} вместо {ord('#')} {ord(' ')}")
    header_exist = False

# наличие вопросов и списка литературы
quest_exist = False
source_exist = False
for post_line in post_list:
    if (post_line[0:2] == "##"):
        if ("Вопросы" in post_line):
            quest_exist = True
        if ("Список" in post_line) and ("литературы" in post_line):
            source_exist = True
if not (quest_exist):
    print("Вопросы не найдены")
if not (source_exist):
    print("Список литературы не найден")


header_text = line_1.replace("# ", "")
header_text = header_text.replace(".", "")
header_text = header_text.strip()
header_text = header_text.strip()
print(f"Заголовок: {header_text}")

# ищем другие лекции по этой теме
readme_path = os.path.join(BASE_DIR, LECTION_DIR, "README.md")
try:
    with open(readme_path, encoding="utf-8") as f:
        readme_html = f.read()
except:
    with open(readme_path, encoding="cp1251") as f:
        readme_html = f.read()


"""
█    █    █████    ███████
█    █   ██   ██   ██    ██
 █  █    ███████   ███████
 █  █    ██   ██   ██  ██
  ██     ██   ██   ██    ██
"""



lection_exist = False
variants_exist = False
in_lections = False # начало поиска вариантов
readme_list = readme_html.split("\n")
for readme_str in readme_list:
    readme_str = readme_str.strip()
    readme_str_list = readme_str.split(" ")
    lection_number = readme_str_list[0]
    readme_str_list.pop(0)
    name_str = " ".join(readme_str_list)
    name_str = name_str.replace(".", "")
    name_str = name_str.strip()


    if len(name_str)>0:
        """
        print(lection_number)
        print(name_str)
        print(header_text)
        #print(f"{ord(name_str[0:1])} {ord(name_str[1:2])} {ord(name_str[2:3])} вместо {ord(header_text[0:1])} {ord(header_text[1:2])} {ord(header_text[2:3])}")
        #print(fuzz.partial_ratio(name_str, header_text))
        print()
        """

        if (str(name_str).lower() == str(header_text).lower()):
            print("Лекция найдена в readme")
            lection_exist = True
            in_lections = True

            post_tokens, post_uniq_text = preprocess_text(post_html)
            print(f"количество уникальных слов: {len(set(post_tokens))}")
            
            bad_tokens_n = orfo_text(post_tokens)
            bad_tokens_stat = int(bad_tokens_n / len(post_tokens) * 10000) / 100
            print(f"процент ошибок: {bad_tokens_stat}%")


            print()



    # ищем конец списка вариантов лекций (пустая строка)
    if lection_exist:
        if (readme_str == ""):
            in_lections = False

    # следующие после названия лекции строки
    if in_lections and (str(name_str).lower() != str(header_text).lower()):
        variants_exist = True
        variant_name, t = readme_str.split("]")
        variant_name = variant_name.strip("[")
        print(f"проверяю {variant_name}")
        t, variant_uri = readme_str.split("(")
        variant_uri = variant_uri.replace("),", "")
        variant_uri = variant_uri.replace(");", "")
        variant_uri = variant_uri.replace(")", "")
        variant_uri = variant_uri.strip()
            
        if ("youtube" in variant_uri) or ("habr" in variant_uri):
            print("external link - не проверяем")
            print()
        else:
            variant_path = os.path.join(BASE_DIR, LECTION_DIR, variant_uri)
            try:
                with open(variant_path, encoding="utf-8") as f:
                    variant_html = f.read()
            except:
                with open(variant_path, encoding="cp1251") as f:
                    variant_html = f.read()

            variant_tokens, variant_uniq_text = preprocess_text(variant_html)
            print(f"количество уникальных слов варианта: {len(set(variant_tokens))}")

            # пересечение множеств 
            min_tokens_len = min([len(set(post_tokens)), len(set(variant_tokens))])
            c = list(set(post_tokens) & set(variant_tokens))
            ratio = (1 - (len(c) / min_tokens_len)) * 100
            print(f"количество совпадающих слов: {len(c)}")
            print(f"уникальность: {ratio:.2f}%")
            print()
            print()

if not(lection_exist):
    print("Лекция не найдена в readme")
if not(variants_exist):
    print("Вариантов не найдено")


exit()
files_paths = []
dirs = os.listdir(BASE_DIR)
for dir in dirs:
    dir_path = os.path.join(BASE_DIR, dir)
    if os.path.isdir(dir_path) and (dir != "__pycache__"):
        files = os.listdir(dir_path)
        for file in files:
            file_path = os.path.join(BASE_DIR, dir, file)
            filename, fileext = os.path.splitext(file)

            if os.path.isfile(file_path) and (fileext=='.md'):
                files_paths.append(file_path)

out_str = ""
max_ratio = 0
max_ratio_file = ""
for file_1 in tqdm(files_paths):
    small_filename_1 = str(file_1).replace(BASE_DIR, "").strip("\\")
    try:
        with open(file_1, encoding="utf-8") as f_1:
            str1 = f_1.read()
    except:
        with open(file_1, encoding="cp1251") as f_1:
            str1 = f_1.read()
            f_1.close()
        with open(file_1, 'w', encoding="utf-8") as f_1:
            f_1.write(str1)
            f_1.close()
                    


    ratio = int(SequenceMatcher(None, str1.lower(), post_html.lower()).ratio() * 100)
    if (ratio > 70):
        out_str += f"{small_filename_1}\n"
        out_str += f"ratio = {ratio}\n"
    if (ratio > max_ratio):
        max_ratio = ratio
        max_ratio_file = small_filename_1

print(out_str)
print()
print(f"max ratio: {max_ratio}%")
print(f"max ratio file: {max_ratio_file}")
print("success")

