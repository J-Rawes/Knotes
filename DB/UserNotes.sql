PGDMP  +    ;                }            Knotes    17.2    17.2     �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16388    Knotes    DATABASE     |   CREATE DATABASE "Knotes" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_Canada.1252';
    DROP DATABASE "Knotes";
                     postgres    false            �            1259    16413 	   UserNotes    TABLE     N   CREATE TABLE public."UserNotes" (
    user_id integer,
    note_id integer
);
    DROP TABLE public."UserNotes";
       public         heap r       postgres    false            �          0    16413 	   UserNotes 
   TABLE DATA           7   COPY public."UserNotes" (user_id, note_id) FROM stdin;
    public               postgres    false    220          d           2606    16421    UserNotes note_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."UserNotes"
    ADD CONSTRAINT note_id FOREIGN KEY (note_id) REFERENCES public."Notes"(note_id) ON UPDATE CASCADE ON DELETE CASCADE;
 =   ALTER TABLE ONLY public."UserNotes" DROP CONSTRAINT note_id;
       public               postgres    false    220            e           2606    16416    UserNotes user_id    FK CONSTRAINT     �   ALTER TABLE ONLY public."UserNotes"
    ADD CONSTRAINT user_id FOREIGN KEY (user_id) REFERENCES public."Users"(user_id) ON UPDATE CASCADE ON DELETE CASCADE;
 =   ALTER TABLE ONLY public."UserNotes" DROP CONSTRAINT user_id;
       public               postgres    false    220            �      x������ � �     