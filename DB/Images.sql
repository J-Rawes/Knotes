PGDMP  4    :                }            Knotes    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16453    Images    TABLE     �   CREATE TABLE public."Images" (
    image_id integer NOT NULL,
    image bytea NOT NULL,
    comment text,
    note_id integer NOT NULL
);
    DROP TABLE public."Images";
       public         heap r       postgres    false            �          0    16453    Images 
   TABLE DATA           E   COPY public."Images" (image_id, image, comment, note_id) FROM stdin;
    public               postgres    false    222   �       e           2606    16459    Images Images_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public."Images"
    ADD CONSTRAINT "Images_pkey" PRIMARY KEY (image_id);
 @   ALTER TABLE ONLY public."Images" DROP CONSTRAINT "Images_pkey";
       public                 postgres    false    222            f           2606    16460    Images note_id    FK CONSTRAINT     v   ALTER TABLE ONLY public."Images"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id);
 :   ALTER TABLE ONLY public."Images" DROP CONSTRAINT note_id;
       public               postgres    false    222            �      x������ � �     